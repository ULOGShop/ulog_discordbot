import {Events, MessageFlags} from "discord.js"
import {handleTransactionIdSubmit, handleSelectMenuInteraction, handleReviewContentSubmit} from "./reviewHandler.js"
import {createErrorEmbed} from "../helpers/embedBuilder.js"
import {readFileSync} from "fs"

const config = JSON.parse(readFileSync("./config.json", "utf-8"))

export function registerInteractionHandlers(client) {
    client.on(Events.InteractionCreate, async (interaction) => {
        try {
            if (interaction.isChatInputCommand()) {
                const command = client.commands.get(interaction.commandName)
                if (command) {
                    await command.execute(interaction)
                }
            }
            if (interaction.isModalSubmit()) {
                if (interaction.customId === "transaction_id_modal") {
                    await handleTransactionIdSubmit(interaction)
                } else if (interaction.customId === "review_content_modal") {
                    await handleReviewContentSubmit(interaction, client)
                }
            }
            if (interaction.isStringSelectMenu()) {
                if (interaction.customId === "open_review_modal") {
                    await handleSelectMenuInteraction(interaction)
                }
            }
        } catch (error) {
            const errorEmbed = createErrorEmbed(interaction, "An error occurred.", "An error occurred while processing your request. Please try again later.", config)
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({embeds: [errorEmbed], flags: MessageFlags.Ephemeral})
            } else {
                await interaction.reply({embeds: [errorEmbed], flags: MessageFlags.Ephemeral})
            }
        }
    })
}