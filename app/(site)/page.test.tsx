import { render, screen } from "@testing-library/react";
import { mockIntersectionObserver, mockMatchMedia } from "@/components/motion/testUtils";
import HomePage from "./page";

describe("HomePage PT", () => {
  let restoreIO: () => void;
  let restoreMedia: () => void;

  beforeEach(() => {
    const io = mockIntersectionObserver();
    restoreIO = io.restore;
    restoreMedia = mockMatchMedia(false);
  });

  afterEach(() => {
    restoreIO();
    restoreMedia();
  });

  it("renders sections in correct order: HowItWorks before BeforeAfter", () => {
    render(<HomePage />);
    const howItWorksHeading = screen.getByText(
      /Como um agente trabalha no seu processo/i
    );
    const beforeAfterHeading = screen.getByText(
      /O mesmo processo, antes e depois/i
    );
    
    const howItWorksPos = howItWorksHeading.compareDocumentPosition(
      beforeAfterHeading
    );
    // DOCUMENT_POSITION_FOLLOWING = 4 means beforeAfterHeading comes after
    expect(howItWorksPos & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  it("renders FAQ before ContactCTA", () => {
    render(<HomePage />);
    const faqHeadings = screen.getAllByText(/Perguntas frequentes/i);
    const ctaHeading = screen.getByText(
      /Tem um processo repetitivo que vive quebrando?/i
    );
    
    // Get the first FAQ heading (PT version)
    const faqHeading = faqHeadings[0];
    
    const faqPos = faqHeading.compareDocumentPosition(ctaHeading);
    // DOCUMENT_POSITION_FOLLOWING = 4 means ctaHeading comes after
    expect(faqPos & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });
});
