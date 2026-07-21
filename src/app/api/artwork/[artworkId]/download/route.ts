import { NextResponse } from "next/server";
import { requireBrokerProfile } from "@/server/policies/broker-policy";
import { ArtworkNotFoundError, getArtworkForDownload } from "@/server/services/artwork-service";

interface RouteParams {
  params: Promise<{ artworkId: string }>;
}

/**
 * RF-065, RN-080: download da arte gerada. Posse verificada no servidor
 * (RN-026) antes de servir o arquivo — nunca confia apenas no
 * `artworkId` da URL.
 */
export async function GET(_request: Request, { params }: RouteParams): Promise<Response> {
  const broker = await requireBrokerProfile();
  const { artworkId } = await params;

  let artwork;
  try {
    artwork = await getArtworkForDownload(artworkId, broker.id);
  } catch (error) {
    if (error instanceof ArtworkNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    throw error;
  }

  const imageResponse = await fetch(artwork.outputUrl);
  if (!imageResponse.ok || !imageResponse.body) {
    return NextResponse.json({ message: "Não foi possível baixar a arte." }, { status: 502 });
  }

  return new Response(imageResponse.body, {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Disposition": `attachment; filename="arte-${artwork.id}.jpg"`,
    },
  });
}
