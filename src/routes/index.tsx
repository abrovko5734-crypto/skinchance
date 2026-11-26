import { createFileRoute } from "@tanstack/react-router";
import { SkinChanceApp } from "@/components/skinchance/SkinApp";

export const Route = createFileRoute("/")({ component: SkinChanceApp });
