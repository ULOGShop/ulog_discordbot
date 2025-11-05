import {SlashCommandBuilder} from "discord.js"
import {handleReviewCommand} from "../handlers/reviewHandler.js"

export const reviewCommand = {
    data: new SlashCommandBuilder().setName("review").setDescription("Create a review for your ULOG Store purchase"),
    async execute(interaction) {
        await handleReviewCommand(interaction)
    }
}