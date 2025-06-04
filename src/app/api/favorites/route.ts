import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

// GET /api/favorites - Récupérer les citations favorites de l'utilisateur
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Récupérer l'utilisateur avec ses citations favorites
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        favorites: {
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!user) {
      // Créer l'utilisateur s'il n'existe pas encore
      const newUser = await prisma.user.create({
        data: {
          id: userId,
          email: "", // Vous pouvez récupérer l'email depuis Clerk si nécessaire
        },
        include: {
          favorites: true,
        },
      })
      return NextResponse.json(newUser.favorites)
    }

    return NextResponse.json(user.favorites)
  } catch (error) {
    console.error("Error fetching favorites:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/favorites - Ajouter une citation aux favorites
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { externalId, content, author } = body

    if (!content || !author) {
      return NextResponse.json({ error: "Content and author are required" }, { status: 400 })
    }

    // Vérifier si l'utilisateur existe, sinon le créer
    let user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          email: "", // Vous pouvez récupérer l'email depuis Clerk si nécessaire
        },
      })
    }

    // Vérifier si la citation existe déjà dans les favorites
    const existingFavorite = await prisma.quote.findFirst({
      where: {
        externalId: externalId,
        users: {
          some: {
            id: userId,
          },
        },
      },
    })

    if (existingFavorite) {
      return NextResponse.json({ error: "Quote already in favorites" }, { status: 409 })
    }

    // Chercher si la citation existe déjà dans la base
    let quote = await prisma.quote.findFirst({
      where: {
        externalId: externalId,
        content: content,
        author: author,
      },
    })

    if (!quote) {
      // Créer la citation si elle n'existe pas
      quote = await prisma.quote.create({
        data: {
          externalId,
          content,
          author,
          users: {
            connect: { id: userId },
          },
        },
      })
    } else {
      // Connecter l'utilisateur à la citation existante
      quote = await prisma.quote.update({
        where: { id: quote.id },
        data: {
          users: {
            connect: { id: userId },
          },
        },
      })
    }

    return NextResponse.json(quote, { status: 201 })
  } catch (error) {
    console.error("Error adding favorite:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
