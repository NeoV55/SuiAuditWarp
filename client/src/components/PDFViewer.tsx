import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download, Eye, FileText } from "lucide-react";
import { getWalrusUrl } from "@/lib/walrus";

interface PDFViewerProps {
  blobId?: string;
  pdfUrl?: string;
  title?: string;
  compact?: boolean;
}

export default function PDFViewer({ 
  blobId, 
  pdfUrl, 
  title = "Audit Report", 
  compact = false 
}: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const finalUrl = blobId ? getWalrusUrl(blobId) : pdfUrl;
  
  if (!finalUrl) {
    return null;
  }

  const handleView = () => {
    window.open(finalUrl, '_blank');
  };

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(finalUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-blue-950 border border-blue-800 rounded">
        <FileText className="w-4 h-4 text-blue-400" />
        <span className="text-blue-200 text-sm flex-1 truncate">{title}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleView}
          className="text-blue-300 hover:text-blue-100 p-1 h-6"
        >
          <Eye className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          disabled={isLoading}
          className="text-blue-300 hover:text-blue-100 p-1 h-6"
        >
          <Download className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="bg-blue-950 border-blue-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-blue-200 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="aspect-[4/3] bg-blue-900 border border-blue-700 rounded-lg overflow-hidden">
          <iframe
            src={`${finalUrl}#toolbar=1&navpanes=1&scrollbar=1`}
            className="w-full h-full"
            title={title}
            loading="lazy"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleView}
            className="flex-1 border-blue-700 text-blue-300 hover:text-blue-100"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in New Tab
          </Button>
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={isLoading}
            className="flex-1 border-blue-700 text-blue-300 hover:text-blue-100"
          >
            <Download className="w-4 h-4 mr-2" />
            {isLoading ? "Downloading..." : "Download PDF"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}