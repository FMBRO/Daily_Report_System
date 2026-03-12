"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SalespersonsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">営業担当者一覧</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>営業担当者</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">営業担当者の一覧がここに表示されます。</p>
        </CardContent>
      </Card>
    </div>
  );
}
