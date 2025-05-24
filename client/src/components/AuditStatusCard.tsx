import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AuditStatusCardProps {
  title: string;
  imageUrl: string;
  items: {
    icon: string;
    title: string;
    description: string;
  }[];
}

export default function AuditStatusCard({ title, imageUrl, items }: AuditStatusCardProps) {
  return (
    <Card className="bg-dark-800 shadow-lg">
      <CardHeader className="px-6 py-4 bg-dark-800 border-b border-dark-900">
        <CardTitle className="text-lg font-medium text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <img 
          src={imageUrl} 
          alt={title} 
          className="w-full h-40 object-cover rounded-md mb-4"
        />
        
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index}>
              <h3 className="text-sm font-medium text-white flex items-center">
                <span className="material-icons text-primary-500 mr-2">{item.icon}</span>
                {item.title}
              </h3>
              <p className="mt-1 text-xs text-gray-400">{item.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
