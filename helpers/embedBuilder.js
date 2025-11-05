import {EmbedBuilder} from "discord.js"

export function createErrorEmbed(interaction, title, description, config) {
    return new EmbedBuilder().setAuthor({name: interaction.user.username, iconURL: interaction.user.displayAvatarURL()}).setTitle(title).setDescription(description).setColor(config.colors.error).setFooter({text: "2025 © ULOG Studios - All Rights Reserved.", iconURL: interaction.guild.iconURL()}).setThumbnail(interaction.guild.iconURL())
}

export function createPaymentEmbed(interaction, payment, productImage, config) {
    const productName = payment.packages[0].name
    const currencySymbol = payment.currency?.symbol || payment.currency || ""
    const embed = new EmbedBuilder().setAuthor({name: interaction.user.username, iconURL: interaction.user.displayAvatarURL()}).addFields({name: "Product", value: `${productName}`, inline: true}, {name: "Price", value: `${currencySymbol} ${payment.amount}`, inline: true}, {name: "Date", value: new Date(payment.date).toLocaleDateString(), inline: true}).setColor(config.colors.primary).setFooter({text: "2025 © ULOG Studios - All Rights Reserved.", iconURL: interaction.guild.iconURL()}).setThumbnail(interaction.guild.iconURL())
    if (productImage) {
        embed.setImage(productImage)
    }
    return embed
}

export function createReviewEmbed(interaction, productName, reviewDescription, rating, stars, productImage, config) {
    const embed = new EmbedBuilder().setAuthor({name: interaction.user.username, iconURL: interaction.user.displayAvatarURL()}).setDescription(`**Review:** ${reviewDescription}`).addFields({name: "Product", value: `${productName}`, inline: true}, {name: "Rating", value: `${stars} (${rating}/5)`, inline: true}).setColor(config.colors.primary).setFooter({text: "2025 © ULOG Studios - All Rights Reserved.", iconURL: interaction.guild.iconURL()}).setThumbnail(interaction.user.displayAvatarURL()).setTimestamp()
    if (productImage) {
        embed.setImage(productImage)
    }
    return embed
}

export function createSuccessEmbed(interaction, title, description, config) {
    return new EmbedBuilder().setAuthor({name: interaction.user.username, iconURL: interaction.user.displayAvatarURL()}).setTitle(title).setDescription(description).setColor(config.colors.primary).setFooter({text: "2025 © ULOG Studios - All Rights Reserved.", iconURL: interaction.guild.iconURL()}).setThumbnail(interaction.guild.iconURL())
}