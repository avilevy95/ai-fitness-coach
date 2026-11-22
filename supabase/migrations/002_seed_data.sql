insert into public.coach_media_assets (
  asset_key,
  exercise_id,
  media_type,
  storage_path,
  public_url,
  title_he,
  text_he,
  priority
)
values
  (
    'warmup',
    null,
    'video',
    'he-IL/warmup.mp4',
    'http://127.0.0.1:54321/storage/v1/object/public/coach-media/he-IL/warmup.mp4',
    'חימום כללי',
    'חימום הדרגתי לכל הגוף לפני האימון',
    0
  ),
  (
    'squat',
    'squat',
    'video',
    'he-IL/squat-demo.mp4',
    'http://127.0.0.1:54321/storage/v1/object/public/coach-media/he-IL/squat-demo.mp4',
    'הדגמת סקוואט',
    'רדו בשליטה, שמרו על גב ניטרלי וברכיים בקו האצבעות',
    0
  ),
  (
    'pushup',
    'pushup',
    'video',
    'he-IL/pushup-demo.mp4',
    'http://127.0.0.1:54321/storage/v1/object/public/coach-media/he-IL/pushup-demo.mp4',
    'הדגמת שכיבת סמיכה',
    'שמרו על גוף ישר והורידו את החזה בשליטה',
    0
  ),
  (
    'cue_squat',
    'squat',
    'audio',
    'he-IL/cues/squat.mp3',
    'http://127.0.0.1:54321/storage/v1/object/public/coach-media/he-IL/cues/squat.mp3',
    'רמז קולי לסקוואט',
    'יופי, שמרו על גב ישר',
    1
  ),
  (
    'cue_pushup',
    'pushup',
    'audio',
    'he-IL/cues/pushup.mp3',
    'http://127.0.0.1:54321/storage/v1/object/public/coach-media/he-IL/cues/pushup.mp3',
    'רמז קולי לשכיבת סמיכה',
    'נשימה החוצה בעלייה',
    2
  )
on conflict (asset_key) do update set
  exercise_id = excluded.exercise_id,
  media_type = excluded.media_type,
  storage_path = excluded.storage_path,
  public_url = excluded.public_url,
  title_he = excluded.title_he,
  text_he = excluded.text_he,
  priority = excluded.priority;
