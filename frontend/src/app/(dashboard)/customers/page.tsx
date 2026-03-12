"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">顧客一覧</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>顧客</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">顧客の一覧がここに表示されます。</p>
        </CardContent>
      </Card>
    </div>
  );
}
