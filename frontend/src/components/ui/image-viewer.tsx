"use client";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Download } from "lucide-react";
import { downloadFile } from "@/lib/download";

/** Image à afficher dans la visionneuse. */
export interface ViewerImage {
  /** URL absolue de l'image (déjà résolue). */
  src: string;
  /** Texte alternatif / titre affiché. */
  alt?: string;
  /** Nom de fichier proposé au téléchargement. */
  downloadName?: string;
}

type OpenViewer = (image: ViewerImage) => void;

const ImageViewerContext = createContext<OpenViewer | null>(null);

/**
 * Ouvre n'importe quelle image dans la visionneuse globale (modale plein
 * écran) au lieu d'un nouvel onglet. À appeler depuis un onClick.
 */
export function useImageViewer(): OpenViewer {
  const ctx = useContext(ImageViewerContext);
  if (!ctx) {
    throw new Error("useImageViewer doit être utilisé dans <ImageViewerProvider>");
  }
  return ctx;
}

export function ImageViewerProvider({ children }: { children: React.ReactNode }) {
  const [image, setImage] = useState<ViewerImage | null>(null);
  const open = useCallback<OpenViewer>((img) => setImage(img), []);
  const value = useMemo(() => open, [open]);

  return (
    <ImageViewerContext.Provider value={value}>
      {children}
      <Dialog.Root
        open={image !== null}
        onOpenChange={(v) => {
          if (!v) setImage(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[100] bg-[hsl(230_30%_8%/0.8)] backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <Dialog.Content
            className="fixed inset-0 z-[100] grid place-items-center p-6 focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
            onClick={() => setImage(null)}
          >
            <Dialog.Title className="sr-only">
              {image?.alt ?? "Aperçu de l'image"}
            </Dialog.Title>
            {image && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.src}
                  alt={image.alt ?? ""}
                  onClick={(e) => e.stopPropagation()}
                  className="max-h-[88vh] max-w-[92vw] rounded-[var(--radius-md)] object-contain shadow-[var(--shadow-3)]"
                />
                <div
                  className="absolute right-5 top-5 flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() =>
                      downloadFile(image.src, image.downloadName ?? image.alt)
                    }
                    title="Télécharger l'image"
                    aria-label="Télécharger l'image"
                    className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      title="Fermer"
                      aria-label="Fermer"
                      className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </Dialog.Close>
                </div>
                {(image.alt || image.downloadName) && (
                  <div
                    className="absolute bottom-5 left-1/2 max-w-[80vw] -translate-x-1/2 truncate rounded-full bg-white/10 px-4 py-1.5 text-[12.5px] font-medium text-white backdrop-blur-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {image.downloadName ?? image.alt}
                  </div>
                )}
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </ImageViewerContext.Provider>
  );
}
