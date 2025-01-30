import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Define the expected data structure
interface WebsiteMetadata {
  canonicalUrl?: string;
  title?: string;
  description?: string;
  author?: string | null;
  keywords?: string | null;
  languageCode?: string;
  openGraph?: Array<{ property: string; content: string }>;
}

interface WebsiteDocument {
  url: string;
  metadata: WebsiteMetadata;
  markdown?: string;
}

const formSchema = z.object({
  url: z
    .string()
    .url({ message: "Please enter a valid URL" })
    .refine(
      (url) => url.includes("api.apify.com") && url.includes("format=json"),
      {
        message: "URL must be a valid Apify API endpoint with JSON format",
      }
    ),
});

type ImportFormValues = z.infer<typeof formSchema>;

interface ImportFormProps {
  onSubmit: (values: ImportFormValues) => Promise<void>;
  className?: string;
}

export function ImportForm({ onSubmit, className }: ImportFormProps) {
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<ImportFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
    },
  });

  async function handleSubmit(values: ImportFormValues) {
    try {
      setError(null);
      setIsSuccess(false);

      // Validate the response format before submitting
      const response = await fetch(values.url);
      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid data format: Expected an array of documents");
      }

      // Validate the first item to ensure it matches our expected format
      const firstItem = data[0] as WebsiteDocument;
      if (!firstItem?.url || !firstItem?.metadata) {
        throw new Error("Invalid data format: Documents must contain url and metadata properties");
      }

      await onSubmit(values);
      setIsSuccess(true);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import content");
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apify Dataset URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://api.apify.com/v2/datasets/[ID]/items?clean=true&format=json"
                    {...field}
                    disabled={form.formState.isSubmitting}
                  />
                </FormControl>
                <FormDescription>
                  Enter the Apify dataset URL that contains your website content in JSON format.
                  The URL should include 'format=json' parameter.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="w-full"
          >
            {form.formState.isSubmitting ? "Validating and Importing..." : "Import Content"}
          </Button>
        </form>
      </Form>

      {isSuccess && (
        <Alert className="bg-green-50 text-green-900 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-900" />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>
            Your content is being imported. Check back in a few minutes to see your documents.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
} 
