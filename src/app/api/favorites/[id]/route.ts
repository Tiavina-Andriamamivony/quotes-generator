import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

// DELETE /api/favorites/[id] - Supprimer une citation des favorites
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const quoteId = Number.parseInt(id)

    if (isNaN(quoteId)) {
      return NextResponse.json({ error: "Invalid quote ID" }, { status: 400 })
    }

    // Vérifier que la citation appartient à l'utilisateur
    const quote = await prisma.quote.findFirst({
      where: {
        id: quoteId,
        users: {
          some: {
            id: userId,
          },
        },
      },
      include: {
        users: true,
      },
    })

    if (!quote) {
      return NextResponse.json({ error: "Quote not found in your favorites" }, { status: 404 })
    }

    // Déconnecter l'utilisateur de la citation
    await prisma.quote.update({
      where: { id: quoteId },
      data: {
        users: {
          disconnect: { id: userId },
        },
      },
    })

    // Si plus aucun utilisateur n'a cette citation en favori, la supprimer
    const updatedQuote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        users: true,
      },
    })

    if (updatedQuote && updatedQuote.users.length === 0) {
      await prisma.quote.delete({
        where: { id: quoteId },
      })
    }

    return NextResponse.json({ message: "Quote removed from favorites" }, { status: 200 })
  } catch (error) {
    console.error("Error removing favorite:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
