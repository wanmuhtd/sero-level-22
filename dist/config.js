window.BIRTHDAY_CONFIG = {
  character_sprite_path: 'assets/character-blonde.png',
  character_fallback_path: 'assets/character-blonde.png',
  // Rows: down/front, left profile, right profile, up/back. Column 0 is idle.
  directional_sprite: { path: 'assets/character-walk.png', columns: 4, rows: 4, directions: ['down','left','right','up'], fps: 8, atlas_size: 1254, row_edges: [0,317,624,928,1254] },
  // Optional spritesheet: rows = idle, walk, jump, celebrate_cheer; frames per row.
  sprite_sheet: null, // { frameWidth: 64, frameHeight: 64, frames: 4, fps: 8 }
  ride_skill: { duration: 5, cooldown: 10, speed: 245, asset_path: 'assets/kebab-scoopy.png', atlas_size: 1254, row_edges: [0,329,592,921,1254], column_edges: [0,306,635,955,1254] },
  memory_photo_path: 'assets/memory.png',
  greeting: 'Selamat ulang tahun ke-22, Sero! (3 November). Semoga di level baru ini semakin banyak kebahagiaan, pencapaian seru, dan perjalanan yang menyenangkan ke depannya!',
  storage_key: 'sero-birthday-v1.1'
};
