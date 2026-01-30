import { Output } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileText } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

interface OutputsViewerProps {
  outputs: Output[];
  taskId?: string;
}

export function OutputsViewer({ outputs, taskId }: OutputsViewerProps) {
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getFileExtension = (path: string) => {
    const match = path.match(/\.([^.]+)$/);
    return match ? match[1] : 'txt';
  };

  const getFileIcon = (path: string) => {
    const ext = getFileExtension(path);
    if (['md', 'txt'].includes(ext)) {
      return <FileText className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const handlePreview = async (output: Output) => {
    if (!output.content) return;

    setLoading(true);
    setPreviewFile(output.content);
    setLoading(false);
  };

  const handleDownload = (output: Output) => {
    const blob = new Blob([output.content || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${output.title}.${getFileExtension(output.path)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (outputs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No outputs available for this task
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Outputs</h3>

      {/* Output files list */}
      <div className="space-y-2 mb-6">
        {outputs.map((output) => (
          <Card key={output.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getFileIcon(output.path)}
                    <h4 className="font-medium">{output.title}</h4>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {output.path}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Updated: {new Date(output.lastModified).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  {output.content && (
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => handlePreview(output)}
                    >
                      Preview
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => handleDownload(output)}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview modal */}
      {previewFile && (
        <Card className="fixed inset-4 z-50 max-w-4xl max-h-[80vh] overflow-auto bg-background">
          <CardHeader className="border-b sticky top-0 bg-background z-10">
            <div className="flex items-center justify-between">
              <CardTitle>Preview</CardTitle>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ✕ Close
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-6 overflow-x-auto">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading preview...
              </div>
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                  {previewFile}
                </ReactMarkdown>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Backdrop */}
      {previewFile && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}
