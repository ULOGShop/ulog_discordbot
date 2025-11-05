import {Events, REST, Routes} from "discord.js"
import {initDatabase} from "../utils/database.js"

async function registerCommands(client, commands) {
    const commandsData = commands.map(cmd => cmd.data.toJSON())
    const rest = new REST({version: "10"}).setToken(process.env.DISCORD_BOT_TOKEN)
    try {
        await rest.put(
            Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID),
            {body: commandsData}
        )
    } catch (error) {}
}

export function registerReadyEvent(client, commands) {
    client.once(Events.ClientReady, async (c) => {
        console.log(`✅ Bot is ready! Logged in as ${c.user.tag}`)
        try {
            await initDatabase()
        } catch (error) {
            process.exit(1)
        }
        await registerCommands(client, commands)
    })
}