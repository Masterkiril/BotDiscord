// index.js
const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    Routes,
    REST,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
} = require("discord.js");

const express = require("express");

// === Переменные окружения ===
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// === Создаем Discord-клиент ===
const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

// ===== РЕГИСТРАЦИЯ СЛЭШ-КОМАНДЫ =====
const commands = [
    new SlashCommandBuilder()
        .setName("contract")
        .setDescription("Отправить сообщение с контрактом Дары моря I"),
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
    try {
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
            body: commands,
        });
        console.log("Команда /contract зарегистрирована");
    } catch (err) {
        console.error("Ошибка регистрации команды:", err);
    }
})();

// ===== ЛОГИКА БОТА =====
let contractTaken = false;
let contractTimestamp = null; // время взятия контракта

client.on("interactionCreate", async (interaction) => {
    if (interaction.isChatInputCommand() && interaction.commandName === "contract") {
        const embed = new EmbedBuilder()
            .setTitle("📄 Контракт: Дары моря I")
            .setDescription(
                "Чтобы взять контракт, нажмите кнопку ниже.\n\n" +
                "**Награда:** 87 000$, +100 репутации, +50 опыта\n" +
                "**Откат:** 24 часа"
            )
            .setColor(0x2f3136);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("take_contract")
                .setLabel("Взять контракт")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("check_timer")
                .setLabel("Таймер")
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    }

    if (interaction.isButton()) {
        // ----- Взять контракт -----
        if (interaction.customId === "take_contract") {
            if (contractTaken) {
                return interaction.reply({
                    content: "❌ Контракт уже занят! Подождите окончание таймера.",
                    ephemeral: true,
                });
            }

            contractTaken = true;
            contractTimestamp = Date.now();

            await interaction.reply(
                `✅ **${interaction.user.username}** взял контракт **"Дары моря I"**!`
            );

            // Таймер на 24 часа
            setTimeout(async () => {
                contractTaken = false;
                contractTimestamp = null;

                const channel = interaction.channel;
                if (channel) {
                    channel.send("🔔 **Контракт снова доступен!**");
                }
            }, 24 * 60 * 60 * 1000); // 24 часа
        }

        // ----- Проверить таймер -----
        if (interaction.customId === "check_timer") {
            if (!contractTaken) {
                return interaction.reply({
                    content: "✅ Контракт доступен прямо сейчас!",
                    ephemeral: true,
                });
            }

            const now = Date.now();
            const endTime = contractTimestamp + 24 * 60 * 60 * 1000;
            const remaining = endTime - now;

            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

            await interaction.reply({
                content: `⏱ Осталось до следующего доступного контракта: ${hours}ч ${minutes}м ${seconds}с`,
                ephemeral: true,
            });
        }
    }
});

// ===== LOGIN =====
client.login(TOKEN);

// ===== EXPRESS ДЛЯ RENDER =====
const app = express();
app.get("/", (req, res) => res.send("Bot is running!"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
