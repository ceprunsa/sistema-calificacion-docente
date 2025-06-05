declare module "@slosarek/docxtemplater-image-module-free" {
  /** Opciones que acepta el constructor */
  export interface ImageModuleOptions {
    /** Devuelve el binario de la imagen (ArrayBuffer | Uint8Array) */
    getImage(tagValue: string): ArrayBuffer | Uint8Array;

    /** Devuelve [ancho, alto] en píxeles */
    getSize(
      image: ArrayBuffer | Uint8Array,
      tagValue: string,
      tagName: string
    ): [number, number];

    /** Opcional: extensión, texto alternativo, etc. */
    getProps?: (tagValue: string) => { extension?: string; alt?: string };

    /** Otros flags admitidos por el módulo */
    centered?: boolean;
    fileType?: "docx" | "pptx";
  }

  /** Clase exportada por el paquete */
  export default class ImageModule {
    constructor(options: ImageModuleOptions);
  }
}
