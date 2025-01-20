import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Edit, File, Save, Trash, Upload } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import { useToast } from "@/components/ui/use-toast";

// Mock document data
const document = {
  id: 1,
  title: "Company Overview",
  content:
    "Our company is a leading provider of innovative solutions in the technology sector...",
  category: "General",
  lastUpdated: "2024-02-20",
  author: "AI System",
  type: "AI Generated",
};

const DocumentDetail = () => {
  const { id } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(document.content);
  const { toast } = useToast();

  const handleSave = () => {
    // Here you would typically save the changes to your backend
    setIsEditing(false);
    toast({
      title: "Changes saved",
      description: "Your document has been updated successfully.",
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result;
        if (typeof text === "string") {
          setContent(text);
          setIsEditing(true);
          toast({
            title: "Document uploaded",
            description: "The document content has been loaded into the editor.",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/knowledge">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {document.title}
            </h1>
            <p className="text-muted-foreground">Document ID: {id}</p>
          </div>
          <div className="flex gap-2">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".md,.txt"
              onChange={handleFileUpload}
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
            {isEditing ? (
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Document
              </Button>
            )}
            <Button variant="destructive">
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <File className="h-5 w-5" />
                Document Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div data-color-mode="light">
                  <MDEditor
                    value={content}
                    onChange={(value) => setContent(value || "")}
                    preview="edit"
                    height={400}
                  />
                </div>
              ) : (
                <div data-color-mode="light">
                  <MDEditor.Markdown source={content} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Document Info</CardTitle>
              <CardDescription>Additional information</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Category
                  </dt>
                  <dd>{document.category}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Last Updated
                  </dt>
                  <dd>{document.lastUpdated}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Author
                  </dt>
                  <dd>{document.author}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Type
                  </dt>
                  <dd>
                    <div
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        document.type === "AI Generated"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {document.type}
                    </div>
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DocumentDetail;