import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card.tsx";
import { ImportForm } from "../../components/knowledge-base/import-form.tsx";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/ui/use-toast.ts";
import { supabase } from "../../integrations/supabase/client.ts";
import { useWorkspace } from "../../hooks/use-workspace.ts";

interface ApifyDocument {
  url: string;
  title: string;
  content?: string;
  markdown?: string;
  description?: string;
  author?: string;
  keywords?: string;
  headers?: Record<string, unknown>;
  openGraph?: Array<{ property: string; content: string; }>;
}

export default function ImportPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { workspace } = useWorkspace();
  const handleImport = async ({ url }: { url: string }) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('You must be logged in to import documents');
      }

      if (!workspace?.id) {
        throw new Error('You must be in a workspace to import documents');
      }

      // First fetch the documents from Apify
      console.log('Fetching documents from:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.statusText}`);
      }

      const documents = await response.json() as ApifyDocument[];
      if (!Array.isArray(documents) || documents.length === 0) {
        throw new Error('No documents found in the response');
      }

      console.log(`Found ${documents.length} documents`);

      // Process the documents into the expected format
      const processedDocuments = documents.map((doc, index) => {
        // Debug logging for title processing
        console.log(`Processing document ${index}:`, {
          originalTitle: doc.title,
          url: doc.url
        });

        if (!doc.title) {
          console.warn('Document missing title:', doc.url);
        }

        // Clean up the title by removing extra whitespace and line breaks
        const cleanTitle = doc.title ? doc.title.replace(/\s+/g, ' ').trim().replace(/\s+[–-]\s+.*$/, '') : null;
        
        console.log(`Cleaned title for document ${index}:`, {
          originalTitle: doc.title,
          cleanTitle: cleanTitle,
          url: doc.url
        });

        return {
          url: doc.url,
          markdown: doc.markdown || doc.content || '',
          content: doc.content || doc.markdown || '',
          metadata: {
            canonicalUrl: doc.url,
            title: cleanTitle || doc.url.split('/').pop()?.replace(/-/g, ' ') || 'Untitled',  // Fallback to URL segment or 'Untitled'
            description: doc.description || null,
            author: doc.author || null,
            keywords: doc.keywords || null,
            headers: doc.headers || {},
            openGraph: doc.openGraph || []
          }
        };
      });

      // Log any documents with potential title issues
      const titlesReport = processedDocuments.map(doc => ({
        url: doc.url,
        title: doc.metadata.title,
        hasTitle: Boolean(doc.metadata.title)
      }));
      console.log('Titles report:', titlesReport);

      // Validate that all documents have titles
      const documentsWithoutTitles = processedDocuments.filter(doc => !doc.metadata.title);
      if (documentsWithoutTitles.length > 0) {
        console.error('Documents without titles:', documentsWithoutTitles);
        throw new Error(`${documentsWithoutTitles.length} documents are missing titles. Please ensure all documents have titles.`);
      }

      // Log the request payload for debugging
      const requestBody = {
        documents: processedDocuments,
        accountId: workspace.id
      };
      
      // Debug log the full request details
      console.log('Request details:', {
        method: 'POST',
        body: requestBody,
        documentsCount: processedDocuments.length,
        bodySize: JSON.stringify(requestBody).length,
        firstDocument: processedDocuments[0]
      });

      // Call the Edge Function with proper body handling
      const { data, error } = await supabase.functions.invoke<{ success: boolean; documentCount: number }>(
        'import-knowledge-base',
        {
          method: 'POST',
          body: requestBody, // Don't stringify - let Supabase handle it
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'x-supabase-auth': 'true'
          }
        }
      );

      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(error.message || 'Failed to import documents');
      }

      if (!data) {
        console.error('No data returned from Edge Function');
        throw new Error('No response from import service');
      }

      console.log('Edge Function response:', data);

      // Show success message
      toast({
        title: "Import Started",
        description: `Started importing ${processedDocuments.length} documents. This may take a few minutes.`,
      });

      // Add a small delay before navigation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Navigate back to the knowledge base list
      navigate('/knowledge-base');
    } catch (error) {
      console.error('Import error:', error);
      
      // Improved error message handling
      let errorMessage = 'Failed to start import process';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Handle Supabase error object
        errorMessage = (error as any).message || (error as any).error_description || JSON.stringify(error);
      }

      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Import Knowledge Base</CardTitle>
            <CardDescription>
              Import your website content into your knowledge base by providing a JSON URL.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImportForm onSubmit={handleImport} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
