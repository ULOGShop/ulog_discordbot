import {ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags, StringSelectMenuBuilder, StringSelectMenuOptionBuilder} from "discord.js"
import {getTebexPayment, getTebexPackageByName} from "../utils/tebexAPI.js"
import {isTransactionUsed, saveReview} from "../utils/database.js"
import {sessionManager} from "../helpers/sessionManager.js"
import {createErrorEmbed, createPaymentEmbed, createReviewEmbed, createSuccessEmbed} from "../helpers/embedBuilder.js"
import {readFileSync} from "fs"

const config = JSON.parse(readFileSync("./config.json", "utf-8"))

export async function handleReviewCommand(interaction) {
    const modal = new ModalBuilder().setCustomId("transaction_id_modal").setTitle("Create Product Review")
    const transactionIdInput = new TextInputBuilder().setCustomId("transaction_id").setLabel("Transaction ID").setPlaceholder("Ex: tbx-123...").setStyle(TextInputStyle.Short).setRequired(true).setMinLength(5).setMaxLength(50)
    const row = new ActionRowBuilder().addComponents(transactionIdInput)
    modal.addComponents(row)
    await interaction.showModal(modal)
}

export async function handleTransactionIdSubmit(interaction) {
    await interaction.deferReply({flags: MessageFlags.Ephemeral})
    const transactionId = interaction.fields.getTextInputValue("transaction_id")
    const alreadyUsed = await isTransactionUsed(transactionId)
    if (alreadyUsed) {
        const errorEmbed = createErrorEmbed(interaction, "Transaction ID already used.", "This Transaction ID has already been used to create a review. Each purchase can only have one review.", config)
        return await interaction.editReply({embeds: [errorEmbed]})
    }
    const payment = await getTebexPayment(transactionId)
    if (!payment) {
        const errorEmbed = createErrorEmbed(interaction, "Transaction/Payment ID not found.", "Transaction/Payment ID not found. Please contact an administrator.", config)
        return await interaction.editReply({embeds: [errorEmbed]})
    }
    if (!payment.packages || payment.packages.length === 0) {
        const errorEmbed = createErrorEmbed(interaction, "No products found in this transaction.", "No products found in this transaction. Please contact an administrator.", config)
        return await interaction.editReply({embeds: [errorEmbed]})
    }
    sessionManager.createSession(interaction.user.id, transactionId, payment)
    const productName = payment.packages[0].name
    let productImage = payment.packages[0].image
    if (!productImage) {
        const packageDetails = await getTebexPackageByName(productName)
        if (packageDetails && packageDetails.image) {
            productImage = packageDetails.image
        }
    }
    const embed = createPaymentEmbed(interaction, payment, productImage, config)
    const selectMenu = new StringSelectMenuBuilder().setCustomId("open_review_modal").setPlaceholder("Select an action...").addOptions(new StringSelectMenuOptionBuilder().setLabel("Submit Review").setDescription("Write a review for this product").setValue("submit_review").setEmoji("📝"))
    const row = new ActionRowBuilder().addComponents(selectMenu)
    await interaction.editReply({embeds: [embed], components: [row]})
}

export async function handleSelectMenuInteraction(interaction) {
    const session = sessionManager.getSession(interaction.user.id)
    if (!session) {
        const errorEmbed = createErrorEmbed(interaction, "Session Expired", "Your review session has expired. Please use `/review` again to start over.", config)
        await interaction.update({components: []})
        return await interaction.followUp({embeds: [errorEmbed], flags: MessageFlags.Ephemeral})
    }
    if (sessionManager.isSessionExpired(interaction.user.id)) {
        sessionManager.deleteSession(interaction.user.id)
        const errorEmbed = createErrorEmbed(interaction, "Session Expired", "Your review session has expired. Please use `/review` again to start over.", config)
        await interaction.update({components: []})
        return await interaction.followUp({embeds: [errorEmbed], flags: MessageFlags.Ephemeral})
    }
    const modal = new ModalBuilder().setCustomId("review_content_modal").setTitle("Write Your Review")
    const productName = session.payment.packages[0].name
    const productNameInput = new TextInputBuilder().setCustomId("product_name").setLabel("Product Name (Cannot be changed)").setValue(productName).setStyle(TextInputStyle.Short).setRequired(true)
    const reviewInput = new TextInputBuilder().setCustomId("review_description").setLabel("Review Description").setPlaceholder("Share your experience with this product...").setStyle(TextInputStyle.Paragraph).setRequired(true).setMinLength(10).setMaxLength(1000)
    const ratingInput = new TextInputBuilder().setCustomId("rating").setLabel("Rating (1-5 stars)").setPlaceholder("Enter a number between 1 and 5").setStyle(TextInputStyle.Short).setRequired(true).setMinLength(1).setMaxLength(1)
    const row1 = new ActionRowBuilder().addComponents(productNameInput)
    const row2 = new ActionRowBuilder().addComponents(reviewInput)
    const row3 = new ActionRowBuilder().addComponents(ratingInput)
    modal.addComponents(row1, row2, row3)
    await interaction.showModal(modal)
}

export async function handleReviewContentSubmit(interaction, client) {
    await interaction.deferReply({flags: MessageFlags.Ephemeral})
    const session = sessionManager.getSession(interaction.user.id)
    if (!session) {
        const errorEmbed = createErrorEmbed(interaction, "Session Expired", "Your review session has expired. Please use `/review` again to start over.", config)
        return await interaction.editReply({embeds: [errorEmbed]})
    }
    const productName = interaction.fields.getTextInputValue("product_name")
    const reviewDescription = interaction.fields.getTextInputValue("review_description")
    const ratingInput = interaction.fields.getTextInputValue("rating")
    const rating = parseInt(ratingInput)
    if (isNaN(rating) || rating < 1 || rating > 5) {
        const errorEmbed = createErrorEmbed(interaction, "Invalid Rating", "Please enter a valid rating between 1 and 5.", config)
        return await interaction.editReply({embeds: [errorEmbed]})
    }
    const expectedProductName = session.payment.packages[0].name
    if (productName !== expectedProductName) {
        const errorEmbed = createErrorEmbed(interaction, "Invalid Product Name", "The product name cannot be modified.", config)
        return await interaction.editReply({embeds: [errorEmbed]})
    }
    let productImage = session.payment.packages[0].image
    if (!productImage) {
        const packageDetails = await getTebexPackageByName(session.payment.packages[0].name)
        if (packageDetails && packageDetails.image) {
            productImage = packageDetails.image
        }
    }
    const displayChannel = await client.channels.fetch(config.channels.review_display)
    if (!displayChannel) {
        const errorEmbed = createErrorEmbed(interaction, "Channel Not Found", "Review display channel not found. Please contact an administrator.", config)
        return await interaction.editReply({embeds: [errorEmbed]})
    }
    const stars = config.emojis.star.repeat(rating)
    const reviewEmbed = createReviewEmbed(interaction, productName, reviewDescription, rating, stars, productImage, config)
    const reviewMessage = await displayChannel.send({embeds: [reviewEmbed]})
    try {
        const reviewData = {
            transactionId: session.transactionId,
            paymentId: session.payment.id?.toString() || null,
            userId: interaction.user.id,
            userUsername: interaction.user.username,
            userAvatar: interaction.user.displayAvatarURL({size: 256, extension: "png"}),
            productId: session.payment.packages[0].id?.toString() || "unknown",
            productName: productName,
            productImage: productImage || null,
            reviewDescription: reviewDescription,
            rating: rating,
            messageId: reviewMessage.id
        }
        await saveReview(reviewData)
    } catch (error) {}
    sessionManager.deleteSession(interaction.user.id)
    const successEmbed = createSuccessEmbed(interaction, "Review Submitted", "Your review has been submitted successfully! Thank you for your feedback.", config)
    await interaction.editReply({embeds: [successEmbed]})
}