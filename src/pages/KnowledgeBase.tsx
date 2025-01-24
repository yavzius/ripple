import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Book, File, Plus, Search, Upload } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

// Mock data for documents
const documents = [
  {
    id: 1,
    title: "Company Overview",
    category: "General",
    lastUpdated: "2024-02-20",
    author: "AI System",
    type: "AI Generated",
  },
  {
    id: 2,
    title: "Product Documentation",
    category: "Technical",
    lastUpdated: "2024-02-19",
    author: "John Doe",
    type: "Uploaded",
  },
  {
    id: 3,
    title: "Customer Service Guidelines",
    category: "Support",
    lastUpdated: "2024-02-18",
    author: "AI System",
    type: "AI Generated",
  },
];

const KnowledgeBase = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground">
            Manage and access company documentation
          </p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Generate with AI
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <File className="h-5 w-5" />
              Total Documents
            </CardTitle>
            <CardDescription>All documents in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{documents.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              AI Generated
            </CardTitle>
            <CardDescription>Documents created by AI</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {documents.filter((doc) => doc.type === "AI Generated").length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Uploaded
            </CardTitle>
            <CardDescription>Manually uploaded documents</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {documents.filter((doc) => doc.type === "Uploaded").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <Link
                        to={`/knowledge-base/${doc.id}`}
                        className="text-primary hover:underline"
                      >
                        {doc.title}
                      </Link>
                    </TableCell>
                    <TableCell>{doc.category}</TableCell>
                    <TableCell>{doc.lastUpdated}</TableCell>
                    <TableCell>{doc.author}</TableCell>
                    <TableCell>
                      <div
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          doc.type === "AI Generated"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {doc.type}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowledgeBase;