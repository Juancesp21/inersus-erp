import { createClient } from '@supabase/supabase-js'

const SB_URL = 'https://glxuzzzjfnqmsgxljctx.supabase.co'
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdseHV6enpqZm5xbXNneGxqY3R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MzM3MTcsImV4cCI6MjA5MDUwOTcxN30.g_gRljJhy4MrVgfd-dO-nsW-ZjP8VvOqN6URLmAVwtE'

export const supabase = createClient(SB_URL, SB_KEY)