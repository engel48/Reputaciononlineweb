import gsap from 'gsap';

/**
 * Crear una nueva timeline de GSAP con opciones predeterminadas
 */
export const createTimeline = (options?: gsap.TimelineVars) => {
  return gsap.timeline(options);
};

/**
 * Animación de desvanecimiento hacia arriba para elementos
 */
export const fadeInUp = (
  element: Element | string | null,
  options?: gsap.TweenVars
) => {
  if (!element) return;
  
  return gsap.from(element, {
    opacity: 0,
    y: 30,
    duration: 0.8,
    ease: "power2.out",
    ...options,
  });
};

/**
 * Animación de desvanecimiento para elementos con retraso escalonado
 */
export const staggerFadeIn = (
  elements: Element[] | string | null,
  staggerValue: number = 0.1,
  options?: gsap.TweenVars
) => {
  if (!elements) return;
  
  return gsap.from(elements, {
    opacity: 0,
    y: 20,
    duration: 0.6,
    stagger: staggerValue,
    ease: "power2.out",
    ...options,
  });
};

/**
 * Animación de número que cuenta desde un valor inicial hasta un valor final
 */
export const animateNumber = (
  element: Element | string | null,
  startValue: number,
  endValue: number,
  options?: gsap.TweenVars
) => {
  if (!element) return;
  
  const obj = { value: startValue };
  const el = gsap.utils.toArray(element)[0] as HTMLElement;
  
  return gsap.to(obj, {
    value: endValue,
    duration: 2,
    ease: "power2.out",
    onUpdate: () => {
      if (el) el.innerHTML = Math.round(obj.value).toString();
    },
    ...options,
  });
};

/**
 * Animación para gráficos y visualizaciones de datos
 */
export const animateChart = (
  element: Element | string | null,
  options?: gsap.TweenVars
) => {
  if (!element) return;
  
  return gsap.from(element, {
    scaleY: 0,
    transformOrigin: "bottom",
    duration: 1.2,
    ease: "elastic.out(1, 0.5)",
    ...options,
  });
};

/**
 * Animación para líneas (como separadores o bordes)
 */
export const animateLine = (
  element: Element | string | null,
  options?: gsap.TweenVars
) => {
  if (!element) return;
  
  return gsap.from(element, {
    scaleX: 0,
    transformOrigin: "left center",
    duration: 0.8,
    ease: "power2.out",
    ...options,
  });
};

/**
 * Efecto de pulsación para resaltar elementos
 */
export const pulseAnimation = (
  element: Element | string | null,
  options?: gsap.TweenVars
) => {
  if (!element) return;
  
  return gsap.to(element, {
    scale: 1.05,
    duration: 0.5,
    repeat: 1,
    yoyo: true,
    ease: "power1.inOut",
    ...options,
  });
};

/**
 * Efecto de máquina de escribir para texto
 */
export const typewriterEffect = (
  element: Element | string | null,
  text: string,
  options?: {
    speed?: number;
    delay?: number;
    onComplete?: () => void;
  }
) => {
  if (!element) return;
  
  const el = gsap.utils.toArray(element)[0] as HTMLElement;
  const speed = options?.speed || 30;
  const delay = options?.delay || 0;
  
  let currentText = "";
  
  el.innerHTML = "";
  
  return gsap.to({}, {
    duration: text.length * (speed / 1000),
    delay,
    onUpdate: function() {
      const progress = this.progress();
      const index = Math.floor(text.length * progress);
      currentText = text.substring(0, index);
      el.innerHTML = currentText;
    },
    onComplete: options?.onComplete,
  });
};

/**
 * Revelación de menú o panel
 */
export const menuReveal = (
  element: Element | string | null,
  fromDirection: "left" | "right" | "top" | "bottom" = "right",
  options?: gsap.TweenVars
) => {
  if (!element) return;
  
  const directionProps: Record<string, gsap.TweenVars> = {
    left: { x: "-100%" },
    right: { x: "100%" },
    top: { y: "-100%" },
    bottom: { y: "100%" },
  };
  
  return gsap.fromTo(
    element,
    {
      ...directionProps[fromDirection],
      opacity: 0,
    },
    {
      x: 0,
      y: 0,
      opacity: 1,
      duration: 0.5,
      ease: "power2.out",
      ...options,
    }
  );
};

/**
 * Transición de página con desvanecimiento
 */
export const pageTransition = (
  outElements: Element[] | string | null,
  inElements: Element[] | string | null,
  options?: {
    outDuration?: number;
    inDuration?: number;
    stagger?: number;
  }
) => {
  const tl = gsap.timeline();
  
  if (outElements) {
    tl.to(outElements, {
      opacity: 0,
      y: -20,
      duration: options?.outDuration || 0.5,
      stagger: options?.stagger || 0.1,
      ease: "power2.in",
    });
  }
  
  if (inElements) {
    tl.from(
      inElements,
      {
        opacity: 0,
        y: 20,
        duration: options?.inDuration || 0.5,
        stagger: options?.stagger || 0.1,
        ease: "power2.out",
      },
      ">-0.1"
    );
  }
  
  return tl;
};

/**
 * Animación de entrada para tarjetas o paneles
 */
export const cardEntrance = (
  elements: Element[] | string | null,
  options?: gsap.TweenVars
) => {
  if (!elements) return;
  
  return gsap.from(elements, {
    opacity: 0,
    y: 40,
    scale: 0.95,
    duration: 0.8,
    stagger: 0.1,
    ease: "power3.out",
    ...options,
  });
};
