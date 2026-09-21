const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Bot Hàn Bối Tháp Online 24/7!'));
app.listen(process.env.PORT || 3000);
require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

const players = {};

function getPlayerData(userId) {
  if (!players[userId]) {
    players[userId] = {
      gold: 100000,
      inventory: [],
      buffSkill: null,
      lastSkillTime: 0,
      skillsOwned: [1, 2],
    };
  }
  return players[userId];
}

const SKILL_DATABASE = [
  { id: 1, ten: '🎋 Tuyệt Kỹ: Khai Môn Khí', desc: 'Khai mở khí môn, tăng 15% tỉ lệ cá Thường', gia: 0 },
  { id: 2, ten: '⚔️ Tuyệt Kỹ: Đoạn Thủy Trảm', desc: 'Đoạn tuyệt thủy lưu, tăng 20% lực giật cần', gia: 0 },
  { id: 3, ten: '🔪 Tuyệt Kỹ: Vạn Cần Đao', desc: 'Vung cần như đao xé sóng, giảm 5s hồi chiêu', gia: 50000 },
  { id: 4, ten: '💥 Tuyệt Kỹ: Trảm Mông Ngư', desc: 'Trảm mông cự ngư, x2 Vàng cá dưới 1000 Cân', gia: 100000 },
  { id: 5, ten: '🌀 Tuyệt Kỹ: Phá Sóng Thần', desc: 'Phá vỡ mặt nước, x1.5 cân nặng lượt sau', gia: 200000 },
];

const DANH_SACH_CA = [
  { ten: '👞 Giày Cao Cổ Đáy Hồ (Hàng Tế)', minKg: 1, maxKg: 5, tyLe: 50, giaVangPerKg: 1, loai: 'rac' },
  { ten: '🐟 Cá Rô Cụ "Vững Như Chó Già"', minKg: 10, maxKg: 50, tyLe: 35, giaVangPerKg: 2, loai: 'thuong' },
  { ten: '🐠 Cá Diếc Đã Tốt Nghiệp Đại Học', minKg: 50, maxKg: 200, tyLe: 10, giaVangPerKg: 5, loai: 'thuong' },
  { ten: '🦈 Cá Mập Lưỡi Dao Hào Đế', minKg: 1000, maxKg: 5000, tyLe: 4, giaVangPerKg: 10, loai: 'hiem' },
  { ten: '👑 TỐ TỐ THẦN THOẠI - VẠN CÂN CHI VƯƠNG', minKg: 100000000, maxKg: 500000000, tyLe: 1, giaVangPerKg: 500, loai: 'than_thoai' },
];

// 1. KHAI BÁO DANH SÁCH SLASH COMMANDS (DANH SÁCH LỆNH /)
const commands = [
  new SlashCommandBuilder().setName('f').setDescription('Quăng cần câu cá Vạn Cân'),
  new SlashCommandBuilder().setName('skill').setDescription('Thi triển tuyệt kỹ hỗ trợ câu cá'),
  new SlashCommandBuilder().setName('gio').setDescription('Xem giỏ cá hiện tại của bạn'),
  new SlashCommandBuilder().setName('banca').setDescription('Bán toàn bộ cá trong giỏ lấy Vàng'),
  new SlashCommandBuilder()
    .setName('skillshop')
    .setDescription('Xem cửa hàng Tuyệt Kỹ')
    .addIntegerOption(option => option.setName('trang').setDescription('Trang cần xem').setRequired(false)),
  new SlashCommandBuilder()
    .setName('muaskill')
    .setDescription('Mua tuyệt kỹ từ cửa hàng')
    .addIntegerOption(option => option.setName('id').setDescription('ID Tuyệt Kỹ cần mua').setRequired(true)),
];

// 2. ĐĂNG KÝ LỆNH SLASH VỚI DISCORD KHI BOT ON
client.once('ready', async () => {
  console.log(`Bot ${client.user.tag} đã online! Đang đăng ký Slash Commands...`);
  
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands.map(cmd => cmd.toJSON()) }
    );
    console.log('✅ Đã đăng ký thành công tất cả các lệnh Slash Commands (/)!');
  } catch (error) {
    console.error('❌ Lỗi khi đăng ký Slash Commands:', error);
  }
});

// 3. XỬ LÝ KHI NGUỜI DÙNG DÙNG LỆNH /
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, user } = interaction;
  const playerData = getPlayerData(user.id);

  if (commandName === 'f') {
    let poolCa = [...DANH_SACH_CA];
    let multiplierKg = 1;
    let multiplierGold = 1;
    let skillMessage = '';

    if (playerData.buffSkill) {
      skillMessage = ` (Kích hoạt **${playerData.buffSkill.ten}**)`;
      multiplierKg = 1.5;
      playerData.buffSkill = null;
    }

    let rand = Math.random() * 100;
    let caCauDuoc = poolCa[0];
    let tongTyLe = 0;

    for (const ca of poolCa) {
      tongTyLe += ca.tyLe;
      if (rand <= tongTyLe) {
        caCauDuoc = ca;
        break;
      }
    }

    let canNang = (Math.random() * (caCauDuoc.maxKg - caCauDuoc.minKg) + caCauDuoc.minKg) * multiplierKg;
    const canNangFormatted = canNang.toLocaleString('vi-VN', { maximumFractionDigits: 1 });
    const giaTriVang = Math.floor(canNang * caCauDuoc.giaVangPerKg * multiplierGold);

    playerData.inventory.push({ ten: caCauDuoc.ten, kg: canNang, giaVang: giaTriVang });

    return interaction.reply(`🎣 <@${user.id}> quăng cần và kéo lên được **${caCauDuoc.ten}** nặng **${canNangFormatted} CÂN**! (Định giá: 🪙 ${giaTriVang.toLocaleString()} Vàng)${skillMessage}`);
  }

  if (commandName === 'skill') {
    const now = Date.now();
    let cooldown = 30000;

    if (now - playerData.lastSkillTime < cooldown) {
      const wait = Math.ceil((cooldown - (now - playerData.lastSkillTime)) / 1000);
      return interaction.reply({ content: `⏳ Vui lòng chờ ${wait}s để hồi chiêu!`, ephemeral: true });
    }

    const randomOwnedId = playerData.skillsOwned[Math.floor(Math.random() * playerData.skillsOwned.length)];
    const activeSkill = SKILL_DATABASE.find((s) => s.id === randomOwnedId);

    playerData.buffSkill = activeSkill;
    playerData.lastSkillTime = now;

    return interaction.reply(`🧘 <@${user.id}> thi triển **[${activeSkill.ten}]**!${activeSkill.desc}`);
  }

  if (commandName === 'gio') {
    if (playerData.inventory.length === 0) return interaction.reply(`🎒 Giỏ cá trống! Vàng hiện có: 🪙 ${playerData.gold.toLocaleString()}`);
    let listText = playerData.inventory.map((item, i) => `${i + 1}. **${item.ten}** -${item.kg.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} Cân`).join('\n');
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
    const page = interaction.options.getInteger('trang') || 1;
    const itemsPerPage = 5;
    const totalPages = Math.ceil(SKILL_DATABASE.length / itemsPerPage);

    const start = (page - 1) * itemsPerPage;
    const pageItems = SKILL_DATABASE.slice(start, start + itemsPerPage);

    let shopText = `📜 **CỬA HÀNG SKILL VẠN CÂN (Trang ${page}/${totalPages})**\n` +
      `💰 **Vàng:** 🪙 ${playerData.gold.toLocaleString()} Vàng\n--------------------------------------------------\n`;

    pageItems.forEach((sk) => {
      const isOwned = playerData.skillsOwned.includes(sk.id) ? '✅ [ĐÃ SỞ HỮU]' : `🪙 ${sk.gia.toLocaleString()} Vàng`;
      shopText += `**ID ${sk.id}.${sk.ten}**\n👉 *${sk.desc}*\nGiá: **${isOwned}**\n\n`;
    });

    shopText += `--------------------------------------------------\n` +
      `💡 Dùng \`/skillshop trang:2\` để sang trang. Mua skill: \`/muaskill id:<ID>\``;

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

    return interaction.reply(`🎉 Học thành công **[${targetSkill.ten}]**! Dùng \`/skill\` để sử dụng.`);
  }
});

client.login(process.env.DISCORD_TOKEN);
require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ==========================================
// 1. CƠ SỞ DỮ LIỆU GAME (DATABASE & STATE)
// ==========================================
const players = {};
const activeEncounters = {}; // Trạng thái kéo cá cá nhân
let activeDungeon = null;      // Trạng thái Phó Bản Boss toàn Server

const SKILL_DATABASE = [
  { id: 1, ten: '🎋 Tuyệt Kỹ: Khai Môn Khí', desc: '+15% Tỷ lệ gặp cá hiếm', gia: 0 },
  { id: 2, ten: '⚔️ Tuyệt Kỹ: Đoạn Thủy Trảm', desc: '+30 Lực kéo gốc', gia: 0 },
  { id: 3, ten: '🔪 Tuyệt Kỹ: Vạn Cần Đao', desc: 'Gây x1.5 Sát thương lên Cá', gia: 50000 },
  { id: 4, ten: '💥 Tuyệt Kỹ: Trảm Mông Ngư', desc: 'X2 Vàng từ cá dưới 1,000 Cân', gia: 100000 },
  { id: 5, ten: '🌀 Tuyệt Kỹ: Phá Sóng Thần', desc: 'Giảm 50% Tỷ lệ đứt dây câu', gia: 200000 },
];

const SHOP_DIEU_PHAP = [
  { id: 101, ten: '📖 Bí Kíp: Thủy Long Điếu Pháp', gia: 150000, reqLevel: 2, desc: 'Tăng 50 Lực kéo & +20% EXP khi câu' },
  { id: 102, ten: '📜 Bí Kíp: Vạn Cân Quy Tông', gia: 500000, reqLevel: 5, desc: 'Tăng 150 Lực kéo & Giảm 80% đứt dây' },
  { id: 103, ten: '📘 Bí Kíp: Thái Cổ Thần Điếu', gia: 2000000, reqLevel: 10, desc: 'Tăng 500 Lực kéo & X2 Vàng toàn bộ cá' },
];

const DANH_SACH_CA = [
  { id: 'rac_1', ten: '👞 Giày Cao Cổ Đáy Hồ', hp: 100, minKg: 1, maxKg: 5, tyLe: 50, giaVangPerKg: 2, loai: 'Rác' },
  { id: 'thuong_1', ten: '🐟 Cá Rô Cụ "Vững Như Chó Già"', hp: 300, minKg: 10, maxKg: 50, tyLe: 35, giaVangPerKg: 5, loai: 'Thường' },
  { id: 'thuong_2', ten: '🐠 Cá Diếc Tốt Nghiệp Đại Học', hp: 600, minKg: 50, maxKg: 200, tyLe: 10, giaVangPerKg: 10, loai: 'Thường' },
  { id: 'hiem_1', ten: '🦈 Cá Mập Lưỡi Dao Hào Đế', hp: 2000, minKg: 1000, maxKg: 5000, tyLe: 4.5, giaVangPerKg: 25, loai: 'Hiếm' },
  { id: 'than_thoai', ten: '👑 TỐ TỐ THẦN THOẠI - VẠN CÂN CHI VƯƠNG', hp: 10000, minKg: 100000, maxKg: 500000, tyLe: 0.5, giaVangPerKg: 100, loai: 'Thần Thoại' },
];

function getPlayerData(userId) {
  if (!players[userId]) {
    players[userId] = {
      gold: 50000,
      fishingLevel: 1,
      fishingExp: 0,
      dungeonLevel: 1,
      dungeonExp: 0,
      inventory: [],       // Giỏ cá
      items: {             // Tủ đồ mở rộng (Inventory)
        vePhoBan: 0,
        chiaKhoaVoCuc: 0,
        thanDuoc: 0,
      },
      skillsOwned: [1, 2],
      dieuPhapOwned: [],   // Danh sách ID sách đã mua
      dieuPhapStudying: null, // { id, startTime, endTime }
      dieuPhapEquipped: null, // Bí kíp đang trang bị
      lastDaily: 0,
    };
  }
  return players[userId];
}

// Hàm vẽ thanh máu (HP Bar)
function renderHpBar(current, max, size = 10) {
  const percentage = Math.max(0, Math.min(1, current / max));
  const progress = Math.round(size * percentage);
  const emptyProgress = size - progress;
  const progressText = '█'.repeat(progress);
  const emptyProgressText = '░'.repeat(emptyProgress);
  return `[${progressText}${emptyProgressText}] ${current}/${max} HP (${Math.floor(percentage * 100)}%)`;
}

// Hàm tính Lực kéo của người chơi dựa trên Level & Điếu Pháp
function getPlayerPullPower(player) {
  let basePower = 50 + player.fishingLevel * 10;
  if (player.dieuPhapEquipped === 101) basePower += 50;
  if (player.dieuPhapEquipped === 102) basePower += 150;
  if (player.dieuPhapEquipped === 103) basePower += 500;
  return basePower;
}

// Hàm tăng EXP và xử lý Lên Cấp
function addFishingExp(player, exp, message) {
  player.fishingExp += exp;
  const nextLevelExp = player.fishingLevel * 100;
  if (player.fishingExp >= nextLevelExp) {
    player.fishingLevel += 1;
    player.fishingExp -= nextLevelExp;
    return `\n🎉 **LÊN CẤP CÂU CÁ!** Bạn đã đạt **Cấp ${player.fishingLevel}**! (Lực kéo tăng thêm +10)`;
  }
  return '';
}

// ==========================================
// 2. LẮNG NGHE LỆNH TIỀN TỐ (!)
// ==========================================
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  const userId = message.author.id;
  const player = getPlayerData(userId);

  // ------------------------------------------
  // LỆNH 1: !f (BẮT ĐẦU CÂU CÁ & HIỆN THANH MÁU)
  // ------------------------------------------
  if (command === 'f') {
    if (activeEncounters[userId]) {
      return message.reply('⚠️ Bạn đang trong một cuộc điếu cá! Hãy bấm nút **[🎣 Kéo Cần]** ở tin nhắn trước.');
    }

    // Random Cá theo tỷ lệ
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

    const embed = new EmbedBuilder()
      .setTitle(`🎣 CÁ ĐÃ CẮN CÂU: ${ca.ten}!`)
      .setColor(ca.loai === 'Thần Thoại' ? 0xFFD700 : 0x0099FF)
      .setDescription(`**Phẩm chất:** ${ca.loai}\n**Cân nặng ước tính:** ${canNang.toLocaleString()} Cân\n\n**Thanh Máu Cá:**\n\`${renderHpBar(ca.hp, ca.hp)}\`\n\n💡 Bấm nút **[🎣 Kéo Cần]** bên dưới để giật cá!`)
      .setFooter({ text: `Lực kéo hiện tại của bạn: ${pullPower} HP/lượt` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`pull_fish_${userId}`).setLabel('🎣 Kéo Cần!').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`giveup_fish_${userId}`).setLabel('❌ Bỏ Cần').setStyle(ButtonStyle.Danger)
    );

    return message.reply({ embeds: [embed], components: [row] });
  }

  // ------------------------------------------
  // LỆNH 2: !daily (ĐIỂM DANH HÀNG NGÀY)
  // ------------------------------------------
  if (command === 'daily') {
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000; // 24 giờ
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

  // ------------------------------------------
  // LỆNH 3: !gacha (QUAY VẬT PHẨM & VÉ PHÓ BẢN)
  // ------------------------------------------
  if (command === 'gacha') {
    const price = 50000;
    if (player.gold < price) return message.reply(`❌ Bạn không đủ tiền! 1 Lượt Gacha tốn 🪙 **50,000 Vàng**.`);

    player.gold -= price;
    const rand = Math.random() * 100;
    let rewardText = '';

    if (rand < 15) {
      player.items.vePhoBan += 1;
      rewardText = '🎟️ **1x Vé Phó Bản Cổ Đại** (Dùng để `/phoban`)';
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

  // ------------------------------------------
  // LỆNH 4: !stealfish (TRỘM CÁ NGUỜI KHÁC)
  // ------------------------------------------
  if (command === 'stealfish') {
    const targetUser = message.mentions.users.first();
    if (!targetUser) return message.reply('⚠️ Bạn phải tag người muốn trộm cá! Ví dụ: `!stealfish @User`');
    if (targetUser.id === userId) return message.reply('❌ Bạn không thể tự trộm cá của chính mình!');

    const targetPlayer = getPlayerData(targetUser.id);
    if (targetPlayer.inventory.length === 0) return message.reply(`🎒 Giỏ cá của <@${targetUser.id}> đang trống rỗng!`);

    const success = Math.random() < 0.4; // 40% thành công
    if (success) {
      const stolenIndex = Math.floor(Math.random() * targetPlayer.inventory.length);
      const stolenFish = targetPlayer.inventory.splice(stolenIndex, 1)[0];
      player.inventory.push(stolenFish);
      return message.reply(`🥷 **TRỘM THÀNH CÔNG!** Bạn đã trộm thành công con **${stolenFish.ten}** (${stolenFish.kg.toLocaleString()} Cân) từ giỏ cá của <@${targetUser.id}>!`);
    } else {
      const fine = 30000;
      player.gold = Math.max(0, player.gold - fine);
      targetPlayer.gold += fine;
      return message.reply(`🚨 **BỊ BẮT QUẢ TANG!** Bạn bị phạt 🪙 **30,000 Vàng** bồi thường trực tiếp cho <@${targetUser.id}>!`);
    }
  }

  // ------------------------------------------
  // LỆNH 5: !shopdieuphap & !hocdieuphap
  // ------------------------------------------
  if (command === 'shopdieuphap') {
    let text = `📚 **CỬA HÀNG SÁCH ĐIẾU PHÁP CỔ ĐẠI**\n💰 Vàng hiện có: 🪙 ${player.gold.toLocaleString()}\n--------------------------------------------------\n`;
    SHOP_DIEU_PHAP.forEach((book) => {
      const owned = player.dieuPhapOwned.includes(book.id) ? '✅ [Đã mua]' : `🪙 ${book.gia.toLocaleString()} Vàng`;
      text += `**ID ${book.id}. ${book.ten}** (Yêu cầu Level ${book.reqLevel})\n👉 *${book.desc}*\nGiá: **${owned}**\n\n`;
    });
    text += `💡 *Dùng \`!muadieuphap <ID>\` để mua sách. Sau đó dùng \`!hocdieuphap <ID>\` để bắt đầu Ngộ Đạo (10 giờ).*`;
    return message.reply(text);
  }

  if (command === 'muadieuphap') {
    const bookId = parseInt(args[0]);
    const book = SHOP_DIEU_PHAP.find((b) => b.id === bookId);
    if (!book) return message.reply('❌ ID Sách Điếu Pháp không hợp lệ!');
    if (player.dieuPhapOwned.includes(bookId)) return message.reply('✅ Bạn đã sở hữu cuốn bí kíp này rồi!');
    if (player.fishingLevel < book.reqLevel) return message.reply(`❌ Cấp độ Câu cá của bạn chưa đủ! Cần Level ${book.reqLevel}.`);
    if (player.gold < book.gia) return message.reply(`❌ Bạn thiếu vàng! Cần 🪙 ${book.gia.toLocaleString()} Vàng.`);

    player.gold -= book.gia;
    player.dieuPhapOwned.push(bookId);
    return message.reply(`🎉 Mua thành công **[${book.ten}]**! Dùng \`!hocdieuphap ${bookId}\` để bắt đầu Ngộ Đạo.`);
  }

  if (command === 'hocdieuphap') {
    const bookId = parseInt(args[0]);
    if (!player.dieuPhapOwned.includes(bookId)) return message.reply('❌ Bạn chưa sở hữu bí kíp này!');
    if (player.dieuPhapStudying) return message.reply('🧘 Bạn đang trong quá trình Luyện Cảnh Ngộ Đạo bí kíp khác rồi!');

    const now = Date.now();
    const duration = 10 * 60 * 60 * 1000; // 10 giờ
    player.dieuPhapStudying = {
      id: bookId,
      startTime: now,
      endTime: now + duration,
    };

    return message.reply(`🧘 **BẮT ĐẦU NGỘ ĐẠO (10 GIỜ)**\nBạn đã nhập thất luyện cảnh bí kíp ID **${bookId}**. Dùng \`!xemdieuphap\` để check tiến trình!`);
  }

  if (command === 'xemdieuphap') {
    if (!player.dieuPhapStudying) {
      const equippedText = player.dieuPhapEquipped ? `ID ${player.dieuPhapEquipped}` : 'Chưa trang bị';
      return message.reply(`📜 **BÍ KÍP ĐIẾU PHÁP**:\n- Bí kíp đang trang bị: **${equippedText}**\n- Trạng thái Luyện cảnh: **Không có**.\n\nDùng \`!trangbidieuphap <ID>\` để gắn skill!`);
    }

    const now = Date.now();
    const study = player.dieuPhapStudying;
    if (now >= study.endTime) {
      player.dieuPhapEquipped = study.id;
      player.dieuPhapStudying = null;
      return message.reply(`✨ **NGỘ ĐẠO HOÀN TẤT!** Bạn đã đại thành bí kíp ID **${study.id}** và tự động trang bị!`);
    }

    const rem
