import { render, screen } from "@testing-library/react";
import {
  mockIntersectionObserver,
  mockMatchMedia,
} from "@/components/motion/testUtils";
import HomePage from "./page";
import HomePageEn from "./en/page";

const PT_H2 = [
  "Como um agente trabalha no seu processo",
  "O mesmo processo, antes e depois",
  "O que eu faço",
  "Projetos em destaque",
  "Casos e decisões de produção",
  "Últimos posts",
  "Perguntas frequentes",
  "Tem um processo repetitivo que vive quebrando?",
];
const EN_H2 = [
  "How an agent works inside your process",
  "The same process, before and after",
  "What I do",
  "Featured projects",
  "Production cases and decisions",
  "Latest posts",
  "Frequently asked questions",
  "Do you have a repetitive workflow that keeps breaking?",
];

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
      /Como um agente trabalha no seu processo/i,
    );
    const beforeAfterHeading = screen.getByText(
      /O mesmo processo, antes e depois/i,
    );

    const howItWorksPos =
      howItWorksHeading.compareDocumentPosition(beforeAfterHeading);
    // DOCUMENT_POSITION_FOLLOWING = 4 means beforeAfterHeading comes after
    expect(howItWorksPos & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("renders FAQ before ContactCTA", () => {
    render(<HomePage />);
    const faqHeadings = screen.getAllByText(/Perguntas frequentes/i);
    const ctaHeading = screen.getByText(
      /Tem um processo repetitivo que vive quebrando?/i,
    );

    // O JSON-LD não cria h2; o primeiro match é o título da seção
    const faqHeading = faqHeadings[0];

    const faqPos = faqHeading.compareDocumentPosition(ctaHeading);
    // DOCUMENT_POSITION_FOLLOWING = 4 means ctaHeading comes after
    expect(faqPos & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("ordem completa das seções (h2)", () => {
    render(<HomePage />);
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent),
    ).toEqual(PT_H2);
  });
});

describe("HomePage EN", () => {
  let restoreIO: () => void;
  let restoreMedia: () => void;

  beforeEach(() => {
    restoreIO = mockIntersectionObserver().restore;
    restoreMedia = mockMatchMedia(false);
  });

  afterEach(() => {
    restoreIO();
    restoreMedia();
  });

  it("ordem completa das seções (h2)", () => {
    render(<HomePageEn />);
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent),
    ).toEqual(EN_H2);
  });
});
