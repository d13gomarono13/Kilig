import { ComicManifest } from './types';

export const MANIFESTS: Record<string, ComicManifest> = {
  "paper-1": {
    title: "Attention Is All You Need (AI)",
    pages: [
      {
        id: "page-1",
        panels: [
          {
            id: "p1-title",
            type: "static",
            title: "The Transformer",
            content: "We propose a new network architecture based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.",
            layout: { x: 1, y: 1, w: 6, h: 2 }
          },
          {
            id: "p1-problem",
            type: "static",
            title: "The Bottleneck",
            content: "Recurrent models process data sequentially. This prevents parallelization and makes long-range dependencies hard to learn.",
            layout: { x: 1, y: 3, w: 3, h: 2 }
          },
          {
            id: "p1-solution",
            type: "revideo",
            title: "Multi-Head Attention",
            revideo: {
              templateId: "attention-mechanism",
              data: { heads: 8 },
              thumbnailUrl: "/placeholder.svg"
            },
            layout: { x: 4, y: 3, w: 3, h: 2 }
          },
          {
            id: "p1-code",
            type: "code",
            title: "Implementation",
            codeSnippet: {
              language: "python",
              code: "def scaled_dot_product_attention(Q, K, V):\n  d_k = K.shape[-1]\n  scores = matmul(Q, K.T) / sqrt(d_k)\n  weights = softmax(scores)\n  return matmul(weights, V)"
            },
            layout: { x: 1, y: 5, w: 6, h: 2 }
          },
          {
            id: "p1-results",
            type: "static",
            title: "State of the Art",
            content: "The Transformer generalizes well to other tasks, achieving 28.4 BLEU on the WMT 2014 English-to-German translation task.",
            layout: { x: 1, y: 7, w: 6, h: 2 }
          }
        ]
      }
    ]
  },
  "paper-2": {
    title: "CRISPR-Cas9: Gene Editing (Biology)",
    pages: [
      {
        id: "page-1",
        panels: [
          {
            id: "p2-title",
            type: "static",
            title: "A Programmable Dual-RNA-Guided DNA Endonuclease",
            content: "We demonstrate that the Cas9 endonuclease can be programmed with guide RNAs to target specific DNA sequences.",
            layout: { x: 1, y: 1, w: 6, h: 2 }
          },
           {
            id: "p2-mechanism",
            type: "revideo",
            title: "The Cas9 Complex",
            revideo: {
              templateId: "protein-folding",
              data: { type: "cas9" },
              thumbnailUrl: "/placeholder.svg"
            },
            layout: { x: 1, y: 3, w: 4, h: 4 }
          },
          {
            id: "p2-target",
            type: "static",
            title: "Targeting",
            content: "The guide RNA (gRNA) matches the target DNA sequence, directing Cas9 to the precise location for cutting.",
            layout: { x: 5, y: 3, w: 2, h: 2 }
          },
          {
            id: "p2-cleavage",
            type: "static",
            title: "Cleavage",
            content: "Double-strand breaks are introduced, triggering the cell's repair mechanisms which can be exploited for editing.",
            layout: { x: 5, y: 5, w: 2, h: 2 }
          },
          {
            id: "p2-implications",
            type: "static",
            title: "Therapeutic Potential",
            content: "This technology opens the door to correcting genetic defects directly in human cells.",
            layout: { x: 1, y: 7, w: 6, h: 2 }
          }
        ]
      }
    ]
  },
  "paper-3": {
    title: "Observation of Gravitational Waves (Physics)",
    pages: [
      {
        id: "page-1",
        panels: [
          {
            id: "p3-splash",
            type: "static",
            title: "GW150914: The Signal",
            content: "LIGO detectors observed a transient gravitational-wave signal. The waveform matches the prediction of general relativity for the inspiral and merger of a pair of black holes.",
            layout: { x: 1, y: 1, w: 6, h: 3 }
          },
          {
            id: "p3-detector",
            type: "revideo",
            title: "Interferometry",
            revideo: {
              templateId: "laser-interferometer",
              data: { arms: "4km" },
              thumbnailUrl: "/placeholder.svg"
            },
            layout: { x: 1, y: 4, w: 3, h: 3 }
          },
          {
            id: "p3-noise",
            type: "static",
            title: "Signal-to-Noise",
            content: "The signal was visible in both Hanford and Livingston detectors with a time delay of 7ms.",
            layout: { x: 4, y: 4, w: 3, h: 3 }
          },
          {
            id: "p3-mass",
            type: "static",
            title: "Black Hole Masses",
            content: "Estimated masses: 36 and 29 solar masses.",
            layout: { x: 1, y: 7, w: 6, h: 2 }
          }
        ]
      }
    ]
  },
  "paper-test": {
    title: "The Physics of a Perfect Coffee",
    pages: [
      {
        id: "p-test",
        panels: [
          {
            id: "t1",
            type: "static",
            title: "Introduction",
            content: "Why does coffee taste better at 93°C? We explore the thermodynamics of extraction.",
            layout: { x: 1, y: 1, w: 6, h: 2 }
          },
          {
            id: "t2",
            type: "revideo",
            title: "Extraction Curve",
            revideo: {
              templateId: "extraction-animator",
              data: { temperature: 93, time: 30 },
              thumbnailUrl: "/placeholder.svg"
            },
            layout: { x: 1, y: 3, w: 4, h: 4 }
          },
          {
            id: "t3",
            type: "static",
            title: "The Result",
            content: "The optimal flavor profile is achieved when the TDS (Total Dissolved Solids) reaches 1.35%.",
            layout: { x: 5, y: 3, w: 2, h: 4 }
          },
          {
            id: "t4",
            type: "code",
            title: "Extraction Formula",
            codeSnippet: {
              language: "javascript",
              code: "const yield = (brewAmount * tds) / coffeeGrounds;"
            },
            layout: { x: 1, y: 7, w: 6, h: 2 }
          }
        ]
      }
    ]
  }
};

// Default export for backward compatibility if needed, though we primarily use MANIFESTS export now
export const DEMO_MANIFEST = MANIFESTS["paper-1"];
