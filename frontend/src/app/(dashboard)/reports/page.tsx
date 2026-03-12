"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">日報一覧</h1>
        <Button>新規作成</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>日報</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">日報の一覧がここに表示されます。</p>
        </CardContent>
      </Card>
    </div>
  );
}
