# 🤖 ULOG Discord Review Bot

A Discord bot that allows users to create and submit reviews for ULOG Store purchases using transaction IDs from Tebex.

## 📋 Features

- ✅ Transaction verification with Tebex API
- ✅ One review per purchase (prevents duplicates)
- ✅ 1-5 star rating system with detailed descriptions
- ✅ Automatic review posting to designated Discord channel
- ✅ MySQL database storage for persistence
- ✅ Session management with auto-expiration (10 minutes)
- ✅ Modular architecture for easy maintenance

## 🏗️ Project Structure

```
ulog-discord-bot/
├── index.js                      # Main entry point
├── config.json                   # Bot configuration (channels, colors, emojis)
├── .env                          # Environment variables (not tracked)
├── commands/
│   └── review.js                 # /review slash command
├── handlers/
│   ├── interactionHandler.js    # Central interaction manager
│   └── reviewHandler.js          # Review workflow logic
├── helpers/
│   ├── embedBuilder.js           # Standardized Discord embeds
│   └── sessionManager.js         # User session management
├── events/
│   └── ready.js                  # Bot ready event handler
└── utils/
    ├── database.js               # MySQL operations
    └── tebexAPI.js               # Tebex API integration
```

## 📦 Prerequisites

- **Node.js** v18.0.0 or higher
- **MySQL** v8.0 or higher
- **Discord Bot** ([Create one here](https://discord.com/developers/applications))
- **Tebex Server Secret** (from your Tebex Creator Dashboard)
- **pnpm** (or npm/yarn)

---

## 🚀 Installation & Setup

### 1️⃣ Install Dependencies

```bash
pnpm install
```

Or using npm:
```bash
npm install
```

### 2️⃣ Configure Environment Variables

Create a `.env` file in the root directory with your credentials:

```env
# Discord Bot Token
DISCORD_BOT_TOKEN=your_discord_bot_token_here

# Tebex Plugin API (para verificar payments)
TEBEX_SECRET_KEY=your_tebex_secret_key_here

# Tebex Headless API (para buscar imagens dos produtos)
TEBEX_WEBSTORE_ID=your_webstore_identifier_here

# Server ID (Guild ID)
GUILD_ID=your_guild_id_here

# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=ulog_reviews
```

### 3️⃣ Set Up Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application** and give it a name
3. Go to **Bot** section → Click **Add Bot**
4. Copy the **Bot Token** → Add to `.env` as `DISCORD_BOT_TOKEN`
5. Enable these **Privileged Gateway Intents**:
   - Message Content Intent
   - Server Members Intent (optional)
6. Go to **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Send Messages`, `Embed Links`, `View Channels`
7. Use the generated URL to invite the bot to your server

**Get your Guild ID:**
- Enable Developer Mode: Discord Settings → Advanced → Developer Mode
- Right-click your server icon → **Copy Server ID**
- Add to `.env` as `GUILD_ID`

### 4️⃣ Configure Bot Settings

Edit `config.json`:

```json
{
  "channels": {
    "review_display": "YOUR_REVIEW_CHANNEL_ID"
  },
  "colors": {
    "primary": 12254985,
    "error": 15548997
  },
  "emojis": {
    "star": "⭐"
  }
}
```

**Get Review Display Channel ID:**
- Right-click the channel where reviews should be posted
- Click **Copy Channel ID**
- Paste into `config.json`

### 5️⃣ Set Up MySQL Database

Connect to MySQL:
```bash
mysql -u root -p
```

Create the database:
```sql
CREATE DATABASE ulog_reviews CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

The bot will automatically create the `reviews` table on first run.

**Manual table creation (optional):**
```sql
USE ulog_reviews;

CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    payment_id VARCHAR(255),
    user_id VARCHAR(255) NOT NULL,
    user_username VARCHAR(255) NOT NULL,
    user_avatar TEXT,
    product_id VARCHAR(255),
    product_name VARCHAR(255) NOT NULL,
    product_image TEXT,
    review_description TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    message_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_user_id (user_id),
    INDEX idx_product_name (product_name)
);
```

### 6️⃣ Start the Bot

**Development:**
```bash
node index.js
```

Expected output:
```
✅ Bot is ready! Logged in as YourBot#1234
```

**Production (with PM2):**
```bash
# Install PM2 globally
npm install -g pm2

# Start bot
pm2 start index.js --name ulog-bot

# View logs
pm2 logs ulog-bot

# Other commands
pm2 restart ulog-bot
pm2 stop ulog-bot
pm2 delete ulog-bot
```

---

## 🎮 How to Use

### For Users

1. Type `/review` in any Discord channel
2. Enter your **Tebex Transaction ID** (e.g., `tbx-123abc456def789`)
   - Find it in your purchase confirmation email from Tebex
3. Click the **Submit Review** button
4. Fill out the review form:
   - **Product Name**: Pre-filled (cannot be changed)
   - **Review Description**: 10-1000 characters
   - **Rating**: 1-5 stars
5. Submit! Your review will appear in the configured review channel

### Transaction ID Format

Only full transaction IDs are supported: `tbx-123abc456def789`

You can find your transaction ID in the purchase confirmation email from Tebex.

---

## 🔧 Configuration

### Change Session Timeout

Edit `helpers/sessionManager.js`:
```javascript
this.SESSION_TIMEOUT = 600000 // 10 minutes (in milliseconds)
```

### Customize Embed Colors

Edit `config.json`:
```json
{
  "colors": {
    "primary": 12254985,  // Hex: #BAF329 (green)
    "error": 15548997     // Hex: #ED4245 (red)
  }
}
```

Convert hex to decimal: Use [this tool](https://www.rapidtables.com/convert/number/hex-to-decimal.html)

### Change Star Emoji

Edit `config.json`:
```json
{
  "emojis": {
    "star": "⭐"  // Change to any emoji
  }
}
```

---

## 🐛 Troubleshooting

### Bot doesn't respond to `/review` command

**Possible causes:**
1. Bot lacks permissions in the channel
   - Solution: Grant `Send Messages`, `Embed Links`, `View Channels`
2. Wrong `GUILD_ID` in `.env`
   - Solution: Verify it matches your Discord server ID
3. Bot not logged in
   - Solution: Check logs with `pm2 logs ulog-bot` or terminal output

### Database connection errors

**Possible causes:**
1. MySQL not running
   - Linux: `sudo systemctl status mysql`
   - Windows: Check Services for MySQL
2. Wrong credentials in `.env`
   - Solution: Double-check `DB_USER`, `DB_PASSWORD`, `DB_NAME`
3. Database doesn't exist
   - Solution: `CREATE DATABASE ulog_reviews;`
4. Permission issues
   ```sql
   GRANT ALL PRIVILEGES ON ulog_reviews.* TO 'your_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

### "Transaction ID not found" error

**Possible causes:**
1. Wrong `TEBEX_SERVER_SECRET` in `.env`
   - Get it from: Tebex Dashboard → Game Servers → Your Server → Settings
2. Transaction doesn't exist or is too old
3. Wrong transaction ID format

### Reviews not appearing in channel

**Possible causes:**
1. Wrong channel ID in `config.json`
   - Solution: Copy channel ID again
2. Bot lacks permissions in that channel
   - Solution: Check channel permissions for the bot role
3. Channel was deleted
   - Solution: Update `config.json` with new channel

---

## 📊 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DISCORD_BOT_TOKEN` | Discord bot authentication token | `MTIzNDU2Nzg5MDEy...` |
| `GUILD_ID` | Your Discord server ID | `123456789012345678` |
| `TEBEX_SERVER_SECRET` | Tebex server secret key | `abc123def456ghi789...` |
| `DB_HOST` | MySQL server hostname | `localhost` or `127.0.0.1` |
| `DB_USER` | MySQL username | `root` or `ulog_user` |
| `DB_PASSWORD` | MySQL password | `YourSecurePassword123` |
| `DB_NAME` | Database name | `ulog_reviews` |
| `DB_PORT` | MySQL port | `3306` (default) |

---

## 🔒 Security Best Practices

1. ✅ **Never commit `.env` to git** - Add it to `.gitignore`
2. ✅ **Use strong database passwords** - At least 16 characters
3. ✅ **Restrict database permissions** - Only grant what's needed
4. ✅ **Keep dependencies updated** - Run `pnpm update` regularly
5. ✅ **Monitor bot logs** - Check for suspicious activity
6. ✅ **Use environment-specific configs** - Separate dev/prod settings
7. ✅ **Rotate secrets periodically** - Change tokens every few months

---

## 📝 Database Schema

The `reviews` table structure:

```sql
id                  INT (Primary Key, Auto Increment)
transaction_id      VARCHAR(255) UNIQUE NOT NULL
payment_id          VARCHAR(255)
user_id             VARCHAR(255) NOT NULL
user_username       VARCHAR(255) NOT NULL
user_avatar         TEXT
product_id          VARCHAR(255)
product_name        VARCHAR(255) NOT NULL
product_image       TEXT
review_description  TEXT NOT NULL
rating              INT (1-5) NOT NULL
message_id          VARCHAR(255)
created_at          TIMESTAMP (Default: CURRENT_TIMESTAMP)
```

Indexes on: `transaction_id`, `user_id`, `product_name`

---

## 🆘 Getting Help

If you encounter issues not covered in troubleshooting:

1. Check the bot logs for error messages
2. Verify all environment variables are correct
3. Ensure Discord bot has proper permissions
4. Check database connection and permissions
5. Contact ULOG Studios support team

---

## 📄 License

© 2025 ULOG Studios - All Rights Reserved

---

## 🎉 Quick Start Summary

```bash
# 1. Install
pnpm install

# 2. Configure
# Create .env file with your credentials

# 3. Setup database
mysql -u root -p
CREATE DATABASE ulog_reviews;
EXIT;

# 4. Run
node index.js
```

**Made with ❤️ by ULOG Studios**
