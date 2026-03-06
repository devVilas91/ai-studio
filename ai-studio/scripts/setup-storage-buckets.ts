import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const buckets = [
  {
    name: "assets",
    public: false,
    fileSizeLimit: 104857600, // 100MB
  },
  {
    name: "thumbnails",
    public: true,
    fileSizeLimit: 10485760, // 10MB
  },
];

async function createBuckets() {
  console.log("Creating Supabase Storage buckets...");

  for (const bucket of buckets) {
    try {
      const { data, error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
      });

      if (error) {
        if (error.message.includes("already exists")) {
          console.log(`Bucket "${bucket.name}" already exists, skipping...`);
        } else {
          console.error(`Failed to create bucket "${bucket.name}":`, error.message);
        }
      } else {
        console.log(`✅ Created bucket: ${bucket.name} (public: ${bucket.public})`);
      }
    } catch (err) {
      console.error(`Error creating bucket "${bucket.name}":`, err);
    }
  }

  console.log("Storage bucket setup complete!");
}

createBuckets().catch(console.error);
