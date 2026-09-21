const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hàn Bối Tháp Bot Online 24/7!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// ==========================================
// 1. KHỞI TẠO WEB SERVER (GIỮ BOT ONLINE 24/7)
// ==========================================
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hàn Bối Tháp Bot Online 24/7!');
});

app.listen(PORT, () => {
  console.log(`[Web Server] Đang chạy trên port ${PORT}`);
});

// ==========================================
// 2. KHAI BÁO THƯ VIỆN DISCORD & CONFIG
// ==========================================
require('dotenv').config();
const { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ==========================================
// 3. CƠ SỞ DỮ LIỆU GAME (DATABASE & STATE)
// ==========================================
const players = {};
const activeEncounters = {};

// SKILL DATABASE
const SKILL_DATABASE = [
  { id: 1, ten: '🎋 Tuyệt Kỹ: Khai Môn Khí', desc: '+15% Tỷ lệ gặp cá hiếm', gia: 0 },
  { id: 2, ten: '⚔️ Tuyệt Kỹ: Đoạn Thủy Trảm', desc: '+30 Lực kéo gốc', gia: 0 },
  { id: 3, ten: '🔪 Tuyệt Kỹ: Vạn Cần Đao', desc: 'Gây x1.5 Sát thương lên Cá', gia: 50000 },
  { id: 4, ten: '💥 Tuyệt Kỹ: Trảm Mông Ngư', desc: 'X2 Vàng từ cá dưới 1,000 Cân', gia: 100000 },
  { id: 5, ten: '🌀 Tuyệt Kỹ: Phá Sóng Thần', desc: 'Giảm 50% Tỷ lệ đứt dây câu', gia: 200000 },
];

// CỬA HÀNG SÁCH ĐIẾU PHÁP
const SHOP_DIEU_PHAP = [
  { id: 101, ten: '📖 Bí Kíp: Thủy Long Điếu Pháp', gia: 150000, reqLevel: 2, desc: 'Tăng 50 Lực kéo & +20% EXP khi câu' },
  { id: 102, ten: '📜 Bí Kíp: Vạn Cân Quy Tông', gia: 500000, reqLevel: 5, desc: 'Tăng 150 Lực kéo & Giảm 80% đứt dây' },
  { id: 103, ten: '📘 Bí Kíp: Thái Cổ Thần Điếu', gia: 2000000, reqLevel: 10, desc: 'Tăng 500 Lực kéo & X2 Vàng toàn bộ cá' },
];

// DANH SÁCH 30 LOẠI CÁ
const DANH_SACH_CA = [
  // --- TRASH / RÁC (5) ---
  { id: 1, ten: '👞 Giày Cao Cổ Đáy Hồ', hp: 80, minKg: 1, maxKg: 3, tyLe: 12.0, giaVangPerKg: 2, loai: 'Trash' },
  { id: 2, ten: '🚲 Lốp Xe Đạp Rỉ Sét', hp: 100, minKg: 2, maxKg: 8, tyLe: 10.0, giaVangPerKg: 1, loai: 'Trash' },
  { id: 3, ten: '🥫 Vỏ Hộp Sữa Bò Cổ', hp: 60, minKg: 1, maxKg: 2, tyLe: 8.0, giaVangPerKg: 3, loai: 'Trash' },
  { id: 4, ten: '🧦 Bít Tất Rách Của Lão Ngư', hp: 50, minKg: 1, maxKg: 1, tyLe: 6.0, giaVangPerKg: 1, loai: 'Trash' },
  { id: 5, ten: '🪵 Khúc Gỗ Mục Đâm Cần', hp: 120, minKg: 5, maxKg: 15, tyLe: 5.0, giaVangPerKg: 2, loai: 'Trash' },

  // --- NORMAL / THƯỜNG (8) ---
  { id: 6, ten: '🐟 Cá Rô Cụ "Vững Như Chó Già"', hp: 250, minKg: 10, maxKg: 30, tyLe: 9.0, giaVangPerKg: 6, loai: 'Normal' },
  { id: 7, ten: '🐠 Cá Diếc Tốt Nghiệp Đại Học', hp: 350, minKg: 20, maxKg: 60, tyLe: 8.0, giaVangPerKg: 8, loai: 'Normal' },
  { id: 8, ten: '🐡 Cá Trê Tinh Mắt Kính', hp: 500, minKg: 50, maxKg: 120, tyLe: 7.0, giaVangPerKg: 10, loai: 'Normal' },
  { id: 9, ten: '🐟 Cá Lóc Luyện Võ Cổ Truyền', hp: 650, minKg: 80, maxKg: 200, tyLe: 6.0, giaVangPerKg: 12, loai: 'Normal' },
  { id: 10, ten: '🦐 Tôm Hùm Sông Biết Khiêu Vũ', hp: 400, minKg: 15, maxKg: 40, tyLe: 5.0, giaVangPerKg: 15, loai: 'Normal' },
  { id: 11, ten: '🦑 Mực Ống Trốn Nợ Bank', hp: 550, minKg: 30, maxKg: 90, tyLe: 4.0, giaVangPerKg: 14, loai: 'Normal' },
  { id: 12, ten: '🦀 Cua Đồng Lưng Bọc Sắt', hp: 450, minKg: 20, maxKg: 50, tyLe: 3.5, giaVangPerKg: 16, loai: 'Normal' },
  { id: 13, ten: '🐟 Cá Chép Già Chờ Hóa Rồng', hp: 700, minKg: 100, maxKg: 250, tyLe: 3.0, giaVangPerKg: 18, loai: 'Normal' },

  // --- RARE / HIẾM (6) ---
  { id: 14, ten: '🦈 Cá Mập Lưỡi Dao Hào Đế', hp: 1500, minKg: 500, maxKg: 1500, tyLe: 2.5, giaVangPerKg: 30, loai: 'Rare' },
  { id: 15, ten: '🐬 Cá Voi Sát Thủ Tập Cử Tạ', hp: 2200, minKg: 1000, maxKg: 3500, tyLe: 2.0, giaVangPerKg: 35, loai: 'Rare' },
  { id: 16, ten: '🐊 Cá Sấu Xiêm Bạch Tạng', hp: 2800, minKg: 2000, maxKg: 6000, tyLe: 1.5, giaVangPerKg: 40, loai: 'Rare' },
  { id: 17, ten: '🐙 Bạch Tuộc Tám Tay Bắn Súng', hp: 2000, minKg: 800, maxKg: 2500, tyLe: 1.2, giaVangPerKg: 45, loai: 'Rare' },
  { id: 18, ten: '🐟 Cá Ngừ Đại Dương Thích Tập GYM', hp: 2500, minKg: 1500, maxKg: 4000, tyLe: 1.0, giaVangPerKg: 50, loai: 'Rare' },
  { id: 19, ten: '🐠 Cá Đao Thủy Điện 1000V', hp: 3000, minKg: 2500, maxKg: 7000, tyLe: 0.8, giaVangPerKg: 60, loai: 'Rare' },

  // --- EPIC / EPIC (5) ---
  { id: 20, ten: '🐉 Cá Rồng Hoàng Kim Cổ Đại', hp: 5000, minKg: 10000, maxKg: 30000, tyLe: 0.5, giaVangPerKg: 80, loai: 'Epic' },
  { id: 21, ten: '🐋 Cá Voi Xanh Khổng Lồ Đáy Hồ', hp: 7500, minKg: 20000, maxKg: 60000, tyLe: 0.4, giaVangPerKg: 100, loai: 'Epic' },
  { id: 22, ten: '🦣 Thủy Quái Megalodon Già Cỗi', hp: 9000, minKg: 40000, maxKg: 90000, tyLe: 0.3, giaVangPerKg: 120, loai: 'Epic' },
  { id: 23, ten: '🐢 Huyền Vũ Trầm Tích Ngàn Năm', hp: 11000, minKg: 50000, maxKg: 120000, tyLe: 0.2, giaVangPerKg: 150, loai: 'Epic' },
  { id: 24, ten: '🐉 Hải Khêu Vương Sóng Thần', hp: 13000, minKg: 80000, maxKg: 200000, tyLe: 0.15, giaVangPerKg: 180, loai: 'Epic' },

  // --- LEGENDARY / TRUYỀN THUYẾT (3) ---
  { id: 25, ten: '👑 TỐ TỐ THẦN THOẠI - VẠN CÂN CHI VƯƠNG', hp: 20000, minKg: 250000, maxKg: 600000, tyLe: 0.08, giaVangPerKg: 250, loai: 'Legendary' },
  { id: 26, ten: '🐙 KRAKEN CHỦ BẮC BĂNG DƯƠNG', hp: 28000, minKg: 500000, maxKg: 1200000, tyLe: 0.05, giaVangPerKg: 350, loai: 'Legendary' },
  { id: 27, ten: '🐲 THÁI CỔ MA LONG DƯỚI ĐÁY TẢO', hp: 35000, minKg: 1000000, maxKg: 2500000, tyLe: 0.03, giaVangPerKg: 500, loai: 'Legendary' },

  // --- SECRET / BÍ ẨN (3) ---
  { id: 28, ten: '✨ THẦN NGƯ THÁI CỔ - HÀN BỐI THÁP BẢO VẬT', hp: 50000, minKg: 5000000, maxKg: 10000000, tyLe: 0.015, giaVangPerKg: 1000, loai: 'Secret' },
  { id: 29, ten: '🌌 CÁ HỐ ĐEN VÔ CỰC (VŨ TRỤ NGUYÊN THỦY)', hp: 80000, minKg: 20000000, maxKg: 50000000, tyLe: 0.008, giaVangPerKg: 2000, loai: 'Secret' },
  { id: 30, ten: '⚜️ ĐIẾU THẦN TRẦN BẮC HẢI (TỔ NGHỀ CÂU CÁ)', hp: 120000, minKg: 100000000, maxKg: 300000000, tyLe: 0.002, giaVangPerKg: 5000, loai: 'Secret' }
];

function getPlayerData(userId) {
  if (!players[userId]) {
    players[userId] = {
      gold: 50000,
      fishingLevel: 1,
      fishingExp: 0,
      inventory: [],       
      items: {             
        vePhoBan: 0,
        chiaKhoaVoCuc: 0,
        thanDuoc: 0,
      },
      skillsOwned: [1, 2],
      dieuPhapOwned: [],   
      dieuPhapEquipped: null, 
      lastDaily: 0,
    };
  }
  return players[userId];
}

// HÀM TÍNH EXP LÊN CẤP & XỬ LÝ LÊN CẤP (LEVEL UP)
function addFishingExp(player, amount) {
  player.fishingExp += Math.floor(amount);
  let reqExp = player.fishingLevel * 500;
  let isLeveledUp = false;

  while (player.fishingExp >= reqExp) {
    player.fishingExp -= reqExp;
    player.fishingLevel += 1;
    reqExp = player.fishingLevel * 500;
    isLeveledUp = true;
  }
  return isLeveledUp;
}

function renderHpBar(current, max, size = 10) {
  const percentage = Math.max(0, Math.min(1, current / max));
  const progress = Math.round(size * percentage);
  const emptyProgress = size - progress;
  return `[${'█'.repeat(progress)}${'░'.repeat(emptyProgress)}]${current}/${max} HP (${Math.floor(percentage * 100)}%)`;
}

function getPlayerPullPower(player) {
  let basePower = 50 + player.fishingLevel * 10;
  if (player.dieuPhapEquipped === 101) basePower += 50;
  if (player.dieuPhapEquipped === 102) basePower += 150;
  if (player.dieuPhapEquipped === 103) basePower += 500;
  return basePower;
}

// ==========================================
// 4. SLASH COMMANDS REGISTER
// ==========================================
const commands = [
  new SlashCommandBuilder().setName('f').setDescription('Quăng cần câu cá Vạn Cân'),
  new SlashCommandBuilder().setName('gio').setDescription('Xem giỏ cá hiện tại của bạn'),
  new SlashCommandBuilder().setName('banca').setDescription('Bán toàn bộ cá trong giỏ lấy Vàng'),
  new SlashCommandBuilder().setName('profile').setDescription('Xem hồ sơ nhân vật & Cấp độ câu cá'),
  new SlashCommandBuilder().setName('skillshop').setDescription('Xem cửa hàng Tuyệt Kỹ'),
  new SlashCommandBuilder()
    .setName('muaskill')
    .setDescription('Mua tuyệt kỹ từ cửa hàng')
    .addIntegerOption(option => option.setName('id').setDescription('ID Tuyệt Kỹ cần mua').setRequired(true)),
];

client.once('ready', async () => {
  console.log(`Bot ${client.user.tag} đã online!`);
  const token = process.env.DISCORD_TOKEN || process.env.TOKEN;
  if (token) {
    const rest = new REST({ version: '10' }).setToken(token);
    try {
      await rest.put(
        Routes.applicationCommands(client.user.id),
        { body: commands.map(cmd => cmd.toJSON()) }
      );
      console.log('✅ Đã đăng ký thành công Slash Commands!');
    } catch (error) {
      console.error('❌ Lỗi khi đăng ký Slash Commands:', error);
    }
  }
});

// ==========================================
// 5. XỬ LÝ LỆNH SLASH (/)
// ==========================================
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, user } = interaction;
  const playerData = getPlayerData(user.id);

  if (commandName === 'f') {
    let rand = Math.random() * 100;
    let caCauDuoc = DANH_SACH_CA[0];
    let tongTyLe = 0;

    for (const ca of DANH_SACH_CA) {
      tongTyLe += ca.tyLe;
      if (rand <= tongTyLe) {
        caCauDuoc = ca;
        break;
      }
    }

    let canNang = Math.floor(Math.random() * (caCauDuoc.maxKg - caCauDuoc.minKg) + caCauDuoc.minKg);
    const giaTriVang = Math.floor(canNang * caCauDuoc.giaVangPerKg);
    const expGained = Math.max(10, Math.floor(canNang * 0.1));

    playerData.inventory.push({ ten: caCauDuoc.ten, kg: canNang, giaVang: giaTriVang, loai: caCauDuoc.loai });

    const isLeveledUp = addFishingExp(playerData, expGained);
    let levelUpMsg = isLeveledUp ? `\n🎉 **LEVEL UP!** Bạn đã đạt Level **${playerData.fishingLevel}**! (Lực kéo tăng +10)` : '';

    return interaction.reply(`🎣 <@${user.id}> quăng cần kéo lên được **[${caCauDuoc.loai}]${caCauDuoc.ten}** nặng **${canNang.toLocaleString()} CÂN**!\n💰 +🪙 ${giaTriVang.toLocaleString()} Vàng | ⚡ +${expGained.toLocaleString()} EXP${levelUpMsg}`);
  }

  if (commandName === 'profile') {
    const reqExp = playerData.fishingLevel * 500;
    const power = getPlayerPullPower(playerData);

    const embed = new EmbedBuilder()
      .setTitle(`📜 HỒ SƠ NGƯ PHỦ: ${user.username}`)
      .setColor(0x00FF00)
      .addFields(
        { name: '⭐ Cấp Độ Câu Cá', value: `Level **${playerData.fishingLevel}**`, inline: true },
        { name: '⚡ Kinh Nghiệm (EXP)', value: `${playerData.fishingExp.toLocaleString()} /${reqExp.toLocaleString()} EXP`, inline: true },
        { name: '💥 Lực Kéo Cần', value: `**${power}** HP/Lượt`, inline: true },
        { name: '💰 Vàng Hiện Có', value: `🪙 **${playerData.gold.toLocaleString()}** Vàng`, inline: true },
        { name: '🎒 Cá Trong Giỏ', value: `${playerData.inventory.length} con`, inline: true }
      );

    return interaction.reply({ embeds: [embed] });
  }

  if (commandName === 'gio') {
    if (playerData.inventory.length === 0) return interaction.reply(`🎒 Giỏ cá trống! Vàng hiện có: 🪙 ${playerData.gold.toLocaleString()}`);
    let listText = playerData.inventory.map((item, i) => `${i + 1}. **[${item.loai}] ${item.ten}** -${item.kg.toLocaleString()} Cân`).join('\n');
    return interaction.reply(`🎒 **GIỎ CÁ**:\n${listText}\n\nDùng \`/banca\` để đổi lấy Vàng!`);
  }

  if (commandName === 'banca') {
    if (playerData.inventory.length === 0) return interaction.reply({ content: `❌ Trong giỏ không có cá!`, ephemeral: true });
    let tongTien = 0;
    playerData.inventory.forEach((item) => { tongTien += item.giaVang; });
    playerData.gold += tongTien;
    const count = playerData.inventory.length;
    playerData.inventory = [];
    return interaction.reply(`💵 Đã bán ${count} con cá thu về 🪙 **${tongTien.toLocaleString()} Vàng**!`);
  }

  if (commandName === 'skillshop') {
    let shopText = `📜 **CỬA HÀNG SKILL VẠN CÂN**\n💰 **Vàng:** 🪙 ${playerData.gold.toLocaleString()} Vàng\n--------------------------------------------------\n`;
    SKILL_DATABASE.forEach((sk) => {
      const isOwned = playerData.skillsOwned.includes(sk.id) ? '✅ [ĐÃ SỞ HỮU]' : `🪙 ${sk.gia.toLocaleString()} Vàng`;
      shopText += `**ID ${sk.id}.${sk.ten}**\n👉 *${sk.desc}*\nGiá: **${isOwned}**\n\n`;
    });
    return interaction.reply(shopText);
  }

  if (commandName === 'muaskill') {
    const skillId = interaction.options.getInteger('id');
    const targetSkill = SKILL_DATABASE.find((s) => s.id === skillId);
    if (!targetSkill) return interaction.reply({ content: `❌ ID Skill không hợp lệ!`, ephemeral: true });

    if (playerData.skillsOwned.includes(skillId)) return interaction.reply({ content: `✅ Bạn đã học skill này rồi!`, ephemeral: true });
    if (playerData.gold < targetSkill.gia) return interaction.reply({ content: `❌ Bạn thiếu vàng! Cần 🪙 ${targetSkill.gia.toLocaleString()} Vàng.`, ephemeral: true });

    playerData.gold -= targetSkill.gia;
    playerData.skillsOwned.push(skillId);
    return interaction.reply(`🎉 Học thành công **[${targetSkill.ten}]**!`);
  }
});

// ==========================================
// 6. XỬ LÝ LỆNH TIỀN TỐ (!)
// ==========================================
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  const userId = message.author.id;
  const player = getPlayerData(userId);

  if (command === 'me' || command === 'profile') {
    const reqExp = player.fishingLevel * 500;
    const power = getPlayerPullPower(player);

    const embed = new EmbedBuilder()
      .setTitle(`📜 HỒ SƠ NGƯ PHỦ: ${message.author.username}`)
      .setColor(0x00FF00)
      .addFields(
        { name: '⭐ Cấp Độ Câu Cá', value: `Level **${player.fishingLevel}**`, inline: true },
        { name: '⚡ Kinh Nghiệm (EXP)', value: `${player.fishingExp.toLocaleString()} /${reqExp.toLocaleString()} EXP`, inline: true },
        { name: '💥 Lực Kéo Cần', value: `**${power}** HP/Lượt`, inline: true },
        { name: '💰 Vàng Hiện Có', value: `🪙 **${player.gold.toLocaleString()}** Vàng`, inline: true },
        { name: '🎒 Cá Trong Giỏ', value: `${player.inventory.length} con`, inline: true }
      );

    return message.reply({ embeds: [embed] });
  }

  if (command === 'f') {
    if (activeEncounters[userId]) {
      return message.reply('⚠️ Bạn đang trong một cuộc điếu cá! Hãy bấm nút **[🎣 Kéo Cần]** ở tin nhắn trước.');
    }

    let rand = Math.random() * 100;
    let ca = DANH_SACH_CA[0];
    let cum = 0;
    for (const c of DANH_SACH_CA) {
      cum += c.tyLe;
      if (rand <= cum) { ca = c; break; }
    }

    const canNang = Math.floor(Math.random() * (ca.maxKg - ca.minKg) + ca.minKg);
    const pullPower = getPlayerPullPower(player);

    activeEncounters[userId] = {
      ca: { ...ca },
      currentHp: ca.hp,
      maxHp: ca.hp,
      kg: canNang,
      pullPower: pullPower,
    };

    let color = 0x0099FF;
    if (ca.loai === 'Rare') color = 0x00FF00;
    if (ca.loai === 'Epic') color = 0x9900FF;
    if (ca.loai === 'Legendary') color = 0xFFD700;
    if (ca.loai === 'Secret') color = 0xFF0000;

    const embed = new EmbedBuilder()
      .setTitle(`🎣 CÁ ĐÃ CẮN CÂU: ${ca.ten}!`)
      .setColor(color)
      .setDescription(`**Phẩm chất:** [${ca.loai}]\n**Cân nặng ước tính:** ${canNang.toLocaleString()} Cân\n\n**Thanh Máu Cá:**\n\`${renderHpBar(ca.hp, ca.hp)}\`\n\n💡 Bấm nút **[🎣 Kéo Cần]** bên dưới để giật cá!`)
      .setFooter({ text: `Lực kéo hiện tại của bạn: ${pullPower} HP/lượt \vert{} Level ${player.fishingLevel}` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`pull_fish_${userId}`).setLabel('🎣 Kéo Cần!').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`giveup_fish_${userId}`).setLabel('❌ Bỏ Cần').setStyle(ButtonStyle.Danger)
    );

    return message.reply({ embeds: [embed], components: [row] });
  }

  if (command === 'daily') {
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;
    if (now - player.lastDaily < cooldown) {
      const wait = Math.ceil((cooldown - (now - player.lastDaily)) / (1000 * 60 * 60));
      return message.reply(`⏳ Bạn đã điểm danh hôm nay rồi! Vui lòng quay lại sau **${wait} giờ**.`);
    }

    const rewardGold = 100000;
    player.gold += rewardGold;
    player.items.vePhoBan += 1;
    player.lastDaily = now;

    return message.reply(`🎁 **ĐIỂM DANH THÀNH CÔNG!**\nBạn nhận được: 🪙 **${rewardGold.toLocaleString()} Vàng** + 🎟️ **1x Vé Phó Bản**.`);
  }

  if (command === 'gacha') {
    const price = 50000;
    if (player.gold < price) return message.reply(`❌ Bạn không đủ tiền! 1 Lượt Gacha tốn 🪙 **50,000 Vàng**.`);

    player.gold -= price;
    const rand = Math.random() * 100;
    let rewardText = '';

    if (rand < 15) {
      player.items.vePhoBan += 1;
      rewardText = '🎟️ **1x Vé Phó Bản Cổ Đại**';
    } else if (rand < 20) {
      player.items.chiaKhoaVoCuc += 1;
      rewardText = '🗝️ **1x Chìa Khóa Vô Cực**';
    } else if (rand < 50) {
      player.items.thanDuoc += 1;
      rewardText = '🧪 **1x Thần Dược Tăng Lực**';
    } else {
      const bonusGold = Math.floor(Math.random() * 80000) + 20000;
      player.gold += bonusGold;
      rewardText = `🪙 **${bonusGold.toLocaleString()} Vàng**`;
    }

    return message.reply(`🎲 **VÒNG QUAY GACHA VẠN CÂN**\nBạn đã chi 🪙 50,000 Vàng và nhận được: ${rewardText}!`);
  }

  if (command === 'stealfish') {
    const targetUser = message.mentions.users.first();
    if (!targetUser) return message.reply('⚠️ Bạn phải tag người muốn trộm cá! Ví dụ: `!stealfish @User`');
    if (targetUser.id === userId) return message.reply('❌ Bạn không thể tự trộm cá của chính mình!');

    const targetPlayer = getPlayerData(targetUser.id);
    if (targetPlayer.inventory.length === 0) return message.reply(`🎒 Giỏ cá của <@${targetUser.id}> đang trống rỗng!`);

    const success = Math.random() < 0.4;
    if (success) {
      const stolenIndex = Math.floor(Math.random() * targetPlayer.inventory.length);
      const stolenFish = targetPlayer.inventory.splice(stolenIndex, 1)[0];
      player.inventory.push(stolenFish);
      return message.reply(`🥷 **TRỘM THÀNH CÔNG!** Bạn đã trộm con **[${stolenFish.loai}]${stolenFish.ten}** (${stolenFish.kg.toLocaleString()} Cân) từ <@${targetUser.id}>!`);
    } else {
      const fine = 30000;
      player.gold = Math.max(0, player.gold - fine);
      targetPlayer.gold += fine;
      return message.reply(`🚨 **BỊ BẮT QUẢ TANG!** Bạn bị phạt 🪙 **30,000 Vàng** bồi thường cho <@${targetUser.id}>!`);
    }
  }

  if (command === 'shopdieuphap') {
    let text = `📚 **CỬA HÀNG SÁCH ĐIẾU PHÁP CỔ ĐẠI**\n💰 Vàng hiện có: 🪙 ${player.gold.toLocaleString()} | Level hiện tại: **${player.fishingLevel}**\n--------------------------------------------------\n`;
    SHOP_DIEU_PHAP.forEach((book) => {
      const owned = player.dieuPhapOwned.includes(book.id) ? '✅ [Đã mua]' : `🪙 ${book.gia.toLocaleString()} Vàng`;
      text += `**ID ${book.id}.${book.ten}** (Yêu cầu Level ${book.reqLevel})\n👉 *${book.desc}*\nGiá: **${owned}**\n\n`;
    });
    return message.reply(text);
  }
});

// ==========================================
// 7. XỬ LÝ NÚT KÉO CẦN / BỎ CẦN
// ==========================================
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const { customId, user } = interaction;
  
  if (customId.startsWith('pull_fish_') || customId.startsWith('giveup_fish_')) {
    const ownerId = customId.split('_')
