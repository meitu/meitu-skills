# Examples

Run scripts (image only):

- `run_image_upscale.sh`
- `run_image_edit.sh`
- `run_image_generate.sh`
- `run_image_tryon.sh`
- `run_image_face_swap.sh`
- `run_image_cutout.sh`

Each script calls:

```bash
python3 meitu-ai/scripts/run_command.py \
  --command <built-in-command> \
  --input-json '<json>'
```
