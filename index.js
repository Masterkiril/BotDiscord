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

const TOKEN = "process.env.TOKEN";
const CLIENT_ID = "1448340464070824131";
const GUILD_ID = "1417744686109560935";

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

// ===== РЕГИСТРАЦИЯ КОМАНДЫ =====
const commands = [
    new SlashCommandBuilder()
        .setName("contract")
        .setDescription("Отправить сообщение с контрактом Дары моря I"),
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commands,
    });
    console.log("Команда /contract зарегистрирована");
})();


// ===== ЛОГИКА БОТА =====
let contractTaken = false; // чтобы нельзя было взять дважды

client.on("interactionCreate", async (interaction) => {
    // ----- команда /contract -----
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === "contract") {
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
                    .setStyle(ButtonStyle.Primary)
            );

            await interaction.reply({ embeds: [embed], components: [row] });
        }
    }

    // ----- кнопка "Взять контракт" -----
    if (interaction.isButton()) {
        if (interaction.customId === "take_contract") {
            if (contractTaken) {
                return interaction.reply({
                    content: "❌ Контракт уже занят! Подождите окончание таймера.",
                    ephemeral: true,
                });
            }

            contractTaken = true;

            await interaction.reply(
                `✅ **${interaction.user.username}** взял контракт **"Дары моря I"**!`
            );

            // === ТАЙМЕР 24 ЧАСА ===
            setTimeout(async () => {
                contractTaken = false;

                const channel = interaction.channel;
                if (channel) {
                    channel.send("🔔 **Контракт снова доступен!**");
                }
            }, 24 * 60 * 60 * 1000); // 24 часа в мс
        }
    }
});

client.login(TOKEN);

