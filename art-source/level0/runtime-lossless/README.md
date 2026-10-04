# Lossless runtime encoding

The 48 existing Tiki V76 PBR channel PNGs are stored here unchanged. Runtime copies use lossless WebP at identical dimensions. Every decoded pixel was compared for exact equality in the original color mode before replacing the runtime PNG. The shared V76 texture initializer now requests WebP for these channels; material values, mesh, UVs and lighting are unchanged. This lossless encoding creates room for Level 0 within the expanded static archive limit.
