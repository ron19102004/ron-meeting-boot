import dotenv from "dotenv";
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";
import { google } from "googleapis";
import express from "express";
dotenv.config();
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_ADMIN_USERNAME = process.env.DISCORD_ADMIN_USERNAME;
const DISCORD_ID = process.env.DISCORD_ID;
const SPREAD_SHEETS = process.env.SPREAD_SHEETS;
const private_key =
  "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC5hMEV3o65WueR\nng12OGEluCTGFNiwXbgVhqWIAvQY7A6EKW81hzaknjmb2G1b8tXmHwrVzDRMeCrZ\nYC25k9SVGh7tuZU3lui01AWvUL0vrEwboJqeOhEDLIiKwD3MiAjP3uBpg/l86U4a\nENu/PZGT2ug9sWbeM8h83hrntfvstLFetMgdYDOODeUgp3MtzDuUml432RhKgTZp\n9EeP0Hef9EjePfTnc7hZ7wj6JeuGogK7xddSxTWkkhGpw2UFk+8H4d8fhL/ywKLN\nO4On0nST0SnNK0+qCbz0ylAfQR0Rg5HFR+AB6h0a6828HpJOG6fs984ByrllCCMg\n5fONy5KtAgMBAAECggEAPYgrpr5HpnDhR6odmu1+Q019XPnDGVQsX29mbeNU5QM+\nmVVI3n83f4g/YVJ6iznS+l2ncVwmqIpe4/SDlf7TTpT4Vy7rsCFsk7WTIR/tb+d8\n4tj1D7AAvoXB0AuNM86W5aNt2XF9iZG0Zu7ag+a+50R/LR8vGFoikE/2qo3wvgRr\nVTCWY3E97Zh2W4BrHjHwLXA9G2ZxqF7Tkd/jOd49Q+zJVZdfYNvpLzW7JUPIEI4P\nEYI5JBgoEIaUeoALpmfzEM1RHDInZ+GgJJOMUlYJ5+VzcL4WUhYUXM0Q1cWlfODQ\nQMgatHwtWz8NUkWBkvqtojIzV0ZKeN7VqeOTqSGoXQKBgQDxLImuicftyqudyFFc\nPLQ6okX76JEoiB8WU9nk/Tp7T+PGPiYSwaX9Ab5gE4fWo9RjVe/jm/OtslQl2Oc9\n5fGb1EdkhoCMhpkyCmrTc9H6JDm1GQkvjkRLQ7wicJut32K+/csdzYhfqNAl58Ah\nZj67Pvs9H9UAuZSCbOEPlPztBwKBgQDE7FexdFGtBvfocfdMvo6tfT9/J/xlr6bk\nkXCXtsiLGNc/JkwjlCz8JBbE90JtilfzI3HKm64vmQi8SEYuR1z2uvQpt8x841Cf\n+SWXS7qE5RCFY7x53zVbbCRn/ijvXENpS8mlWv0bKdCm6DorUhD+8o4dDHrOYokj\naMin2lwJqwKBgBslqUXVSoTwyEqVbtsUFjF3bKtDbXuDfwRTYfaNrpSM1JXPDxgT\nZizJknVcHXFCtbiMxtj3CAHoTeKIvNbR2FVzGqotHbEzwXDJjWbJ5bvjcf95lvgc\naoGSWU4DIPL8bzASf1eWeCBUb0GlCZJ44NzQ5RTnTWGsghQAT4EigynnAoGABueq\no4RKoOCPrMziOQStiBPOOC00wnQITBd1dTxph8cVNReor86wTR8O1VU+NQ0WzGW/\nxbTzxKN/FOsL2u+RqO0hRp01RGPMHe/ki4uSPLqze5nlr/hNrKj8FdFpqgr4KicI\nKQ4ptdwfftrBv2cfRXFH3mjjnX0DBgTUlF4pwAUCgYBMq6owN2bYF56yCxioEKgO\n9MEkHsP/Gmv1x+MYnve3UI4keC7BTNa3cW4JZ+pM6tSvDCtbFWPh2FrKtW8k8rfl\nl/54P53G70F9cjRsxVw3jKa3KMK5M5EURH3NHSXlZKT2q9UcTpmEbrxBTEUqE4B0\nvcNIeLCrn7BdbzOFKPu6Hw==\n-----END PRIVATE KEY-----\n";
const client_email = "ron-meeting-bot@ron-meeting-bot.iam.gserviceaccount.com";
let enabled_bot = true;
const app = express();
app.use("/", (req, res) => {
  res.json({ enabled: enabled_bot });
});
const authGG = new google.auth.GoogleAuth({
  credentials: {
    private_key: private_key,
    client_email: client_email,
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
let dataRequestSheet = [];
let dataResponseSheet = [];
const loadDataFromSheets = async () => {
  const range = "Sheet1!A1:B4000";
  const sheets = google.sheets({ version: "v4", auth: authGG });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREAD_SHEETS,
    range: range,
  });
  let _dataRequestSheet = [];
  let _dataResponseSheet = [];
  const data = res.data.values;
  for (let i = 1; i < data.length; i++) {
    _dataRequestSheet.push(data[i][0]);
    _dataResponseSheet.push(data[i][1]);
  }
  dataRequestSheet = _dataRequestSheet;
  dataResponseSheet = _dataResponseSheet;
};
await loadDataFromSheets();
/**
 *
 * @param {string} message
 * @return {string}
 */
const getResponseWithRequest = (message) => {
  let index = dataRequestSheet.findIndex((value) =>
    message.toLowerCase().includes(value)
  );
  if (index === -1) return "";
  try {
    const data = dataResponseSheet[index].split("$");
    const random = Math.floor(Math.random() * data.length);
    return data[random];
  } catch (e) {
    return "";
  }
};
// Create test slash command
// const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);
// try {
//   await rest.put(Routes.applicationCommands(DISCORD_ID), {
//     body: [
//       new SlashCommandBuilder().setName("load-response").setDescription("test"),
//     ],
//   });
// } catch (error) {
//   console.error(error);
// }
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
client.on("ready", () => {
  console.log(`Logged in as ${client.user.id}!`);
});
//handle interaction
// client.on("interactionCreate", async (interaction) => {
//   if (!interaction.isChatInputCommand()) return;
//   if (interaction.commandName === "load-response") {
//     await loadDataFromSheets();
//     await interaction.reply("Loaded chat response");
//   }
// });

//handle message
const isAdmin = (username) => {
  return DISCORD_ADMIN_USERNAME === username;
};
client.on("messageCreate", async (message) => {
  if (message.author.bot || message.author.id === client.user.id) return;
  if (message.content === "$") {
    let menu = "#####***Menu***#####\n";
    menu += "**$load** : Cập nhật dữ liệu trả về\n";
    menu += "**$enable** : Bật bot chat\n";
    menu += "**$disable** : Tắt bot chat\n";
    menu += `Trạng thái: **${
      enabled_bot ? "Bot đang được bật" : "Bot đang được tắt"
    }**`;
    message.reply(menu);
    return;
  }
  const statement = message.content.trim().split(" ")[0];
  switch (statement) {
    case "$ban": {
      if (isAdmin(message.author.username)) {
        if (message.mentions.repliedUser) {
          await message.guild.bans.create(message.mentions.repliedUser, {
            reason: "antingocvien!",
          });
          await message.reply("Banned user!");
        }
      } else {
        await message.reply("Bạn không được quyền ban người dùng.");
      }
      break;
    }
    case "$unban": {
      if (isAdmin(message.author.username)) {
        if (message.mentions.repliedUser) {
          await message.guild.bans.remove(message.mentions.repliedUser, {
            reason: "antingocvien!",
          });
          await message.reply("Unbanned user!");
        }
      }
      break;
    }
    case "$load": {
      if (enabled_bot) {
        await loadDataFromSheets();
        await message.reply("Loaded chat response");
      } else {
        await message.reply("Bot đang tắt. Vui lòng bật bằng  $enable.");
      }
      break;
    }
    case "$enable": {
      if (enabled_bot) {
        await message.reply("Bot đã thực sự được bật");
      } else {
        enabled_bot = true;
        await message.reply("Bot đã bật.");
      }
      break;
    }
    case "$disable": {
      if (!enabled_bot) {
        await message.reply("Bot đã thực sự được tắt");
      } else {
        enabled_bot = false;
        await message.reply("Bot đã tắt.");
      }
      break;
    }
    default: {
      if (enabled_bot) {
        const response = getResponseWithRequest(message.content);
        if (response.length > 0) {
          await message.reply(response);
        }
      }
    }
  }
});
client.login(DISCORD_TOKEN);
app.listen(3000, () => {
  console.log("Listening on port 3000");
});
