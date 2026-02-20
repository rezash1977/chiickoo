
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function getCategories() {
    const { data, error } = await supabase.from('categories').select('*')
    if (error) {
        console.error(error)
        return
    }
    console.log(JSON.stringify(data, null, 2))
}

getCategories()
