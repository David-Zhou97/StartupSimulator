// 图标类素材白底转透明（场景插画类不处理，保留白底作画框）。
// 用法：npm i sharp 后运行  node tools/prep_assets.mjs [--fuzz 8]
// 处理 assets/ 下已存在的图标类文件（webp/png），原地覆盖；
// 若图内高光被误伤，用更小容差重跑：node tools/prep_assets.mjs --fuzz 4
import sharp from "sharp";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ICON_IDS = [
  "idea_ai", "idea_brand", "idea_ring",
  "attr_cash", "attr_team", "attr_network", "attr_health", "attr_traction",
  "stamp_success", "stamp_mid", "stamp_fail",
  "fx_crit_success", "fx_crit_fail", "card_frame", "badge_round",
];

const fuzzArg = process.argv.indexOf("--fuzz");
const fuzzPct = fuzzArg > -1 ? Number(process.argv[fuzzArg + 1]) : 8;
const threshold = Math.round(255 - 255 * (fuzzPct / 100)); // fuzz 8% → ≥235 视为白

for (const id of ICON_IDS) {
  for (const ext of ["webp", "png"]) {
    const file = join(ROOT, "assets", `${id}.${ext}`);
    if (!existsSync(file)) continue;
    const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let cleared = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] >= threshold && data[i + 1] >= threshold && data[i + 2] >= threshold) {
        data[i + 3] = 0;
        cleared++;
      }
    }
    const out = sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } });
    await (ext === "webp" ? out.webp({ lossless: true }) : out.png()).toFile(file + ".tmp");
    const { renameSync } = await import("fs");
    renameSync(file + ".tmp", file);
    console.log(`${id}.${ext}: ${info.width}x${info.height}, 透明化 ${(cleared / (data.length / 4) * 100).toFixed(1)}% 像素 (fuzz ${fuzzPct}%)`);
  }
}
console.log("done");
