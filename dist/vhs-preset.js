// Curated for this game; not an upstream default or a damaged-tape preset.
// JSON keys/enums are the official ntsc-rs version-1 preset format.
export const VHS_SATURATION = 1.16;
export const VHS_PRESET = Object.freeze({
  version: 1, random_seed: 10, use_field: 3, filter_type: 1,
  input_luma_filter: 2, chroma_lowpass_in: 2, composite_preemphasis: .65,
  composite_noise: true, composite_noise_intensity: .015,
  composite_noise_frequency: .5, composite_noise_detail: 1,
  snow_intensity: .00012, snow_anisotropy: .5,
  video_scanline_phase_shift: 2, video_scanline_phase_shift_offset: 0,
  chroma_demodulation: 1, luma_smear: .5,
  head_switching: true, head_switching_height: 4, head_switching_offset: 2,
  head_switching_horizontal_shift: 8, head_switching_start_mid_line: false,
  head_switching_mid_line_position: .95, head_switching_mid_line_jitter: .03,
  tracking_noise: false, ringing: false,
  luma_noise: true, luma_noise_intensity: .012,
  luma_noise_frequency: .45, luma_noise_detail: 1,
  chroma_noise: true, chroma_noise_intensity: .025,
  chroma_noise_frequency: .05, chroma_noise_detail: 2,
  chroma_phase_error: 0, chroma_phase_noise_intensity: .0008,
  chroma_delay_horizontal: 0, chroma_delay_vertical: 0,
  vhs_settings: true, vhs_tape_speed: 1, vhs_chroma_loss: 0,
  vhs_sharpen_enabled: false, vhs_edge_wave_enabled: true,
  vhs_edge_wave: .22, vhs_edge_wave_speed: 2, vhs_edge_wave_frequency: .035,
  vhs_edge_wave_detail: 2, vhs_chroma_vert_blend: true,
  chroma_lowpass_out: 2, scale_settings: true, bandwidth_scale: 1,
  vertical_scale: 1, scale_with_video_size: false,
});
