import {Client, GatewayIntentBits, Collection} from "discord.js"
import dotenv from "dotenv"
import {closeDatabase} from "./utils/database.js"
import {registerReadyEvent} from "./events/ready.js"
import {registerInteractionHandlers} from "./handlers/interactionHandler.js"
import {reviewCommand} from "./commands/review.js"

dotenv.config()

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
})

client.commands = new Collection()
const commands = [reviewCommand]
commands.forEach(cmd => client.commands.set(cmd.data.name, cmd))

registerReadyEvent(client, commands)
registerInteractionHandlers(client)

const shutdown = async () => {
    await closeDatabase()
    client.destroy()
    process.exit(0)
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)

client.login(process.env.DISCORD_BOT_TOKEN)