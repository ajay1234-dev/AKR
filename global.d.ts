// Global type declarations for web APIs in React Native
declare global {
  interface Document {
    createElement(tagName: string): any;
  }
  
  var document: Document | undefined;
}

export {};
