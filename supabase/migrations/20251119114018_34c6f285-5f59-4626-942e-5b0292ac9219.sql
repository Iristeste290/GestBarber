-- Create storage bucket for post images
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true);

-- Create storage policies for post images
CREATE POLICY "Users can upload their own post images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'post-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own post images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'post-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own post images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'post-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public post images are viewable by everyone"
ON storage.objects
FOR SELECT
USING (bucket_id = 'post-images');