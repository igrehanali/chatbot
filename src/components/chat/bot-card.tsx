import Link from "next/link";
import { Pencil } from "lucide-react";
import { CreateBotDialog } from "@/components/chat/create-bot-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Chatbot } from "@/types/chat";

interface BotCardProps {
  bot: Chatbot;
  messageCount: number;
  onEditBot: (botId: string, input: {
    name: string;
    description: string;
    systemContext: string;
    avatarUrl?: string;
  }) => void;
}

export function BotCard({ bot, messageCount, onEditBot }: BotCardProps) {
  return (
    <Card className="animate-fade-up border-white/40 bg-card/90 backdrop-blur-sm">
      <CardHeader className="gap-3">
        <div className="flex items-center gap-3">
          <Avatar>
            {bot.avatarUrl ? <AvatarImage src={bot.avatarUrl} alt={`${bot.name} avatar`} /> : null}
            <AvatarFallback className="font-display font-semibold">{bot.avatar}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <CardTitle className="text-base leading-tight">{bot.name}</CardTitle>
            <p className="text-xs text-muted-foreground">{messageCount} messages</p>
          </div>
        </div>
        <CardDescription>{bot.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3 text-sm text-muted-foreground">{bot.systemContext}</p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button asChild className="flex-1">
          <Link href={`/chat/${bot.id}`}>Open Chat</Link>
        </Button>

        <CreateBotDialog
          mode="edit"
          initialValues={{
            name: bot.name,
            description: bot.description,
            systemContext: bot.systemContext,
            avatarUrl: bot.avatarUrl ?? "",
          }}
          onSubmitBot={(input) => onEditBot(bot.id, input)}
          trigger={
            <Button type="button" variant="outline" size="icon" aria-label={`Edit ${bot.name}`}>
              <Pencil className="h-4 w-4" />
            </Button>
          }
        />
      </CardFooter>
    </Card>
  );
}
