import gsap from 'gsap';

/**
 * Biblioteca de animaciones avanzadas con comportamientos de IA
 * Estas animaciones simulan patrones inteligentes y adaptativos
 */

/**
 * Crea un efecto de "pensamiento" simulando cómo una IA procesa información
 * Ideal para momentos de carga o procesamiento
 */
export const aiThinking = (
  element: Element | string | null,
  options?: { delay?: number } & Omit<gsap.TweenVars, 'delay'>
) => {
  if (!element) return;
  
  const tl = gsap.timeline({
    repeat: options?.repeat || 2,
    yoyo: true,
    ...options
  });
  
  tl.to(element, {
    boxShadow: "0 0 15px rgba(0, 100, 255, 0.8)",
    scale: 1.03,
    duration: 0.8,
    ease: "sine.inOut"
  })
  .to(element, {
    opacity: 0.8,
    duration: 0.4,
    ease: "power1.inOut"
  }, "-=0.4")
  .to(element, {
    opacity: 1,
    scale: 1,
    duration: 0.6,
    ease: "back.out"
  });
  
  return tl;
};

/**
 * Crea un efecto de análisis de datos que simula el procesamiento inteligente
 * Perfecto para visualizaciones de datos o contenido analítico
 */
export const aiDataAnalysis = (
  elements: Element[] | NodeListOf<Element> | string | null,
  options?: { delay?: number } & Omit<gsap.TweenVars, 'delay'>
) => {
  if (!elements) return;
  
  const tl = gsap.timeline(options);
  const items = gsap.utils.toArray(elements);
  
  tl.from(items, {
    opacity: 0,
    scale: 0.7,
    y: 20,
    stagger: {
      each: 0.05, // Reducido de 0.1 a 0.05 para disminuir el lag
      from: "random", // Efecto aleatorio que simula procesamiento no lineal
      grid: "auto",
    },
    duration: 0.5, // Reducido de 0.8 a 0.5 para acelerar la animación
    ease: "power2.out",
  })
  // Asegurar que todos los elementos tengan valores finales correctos
  .to(items, {
    opacity: 1,
    scale: 1,
    y: 0,
    clearProps: "all",
    duration: 0.1
  });
  
  return tl;
};

/**
 * Simula un efecto de aprendizaje de patrones, donde los elementos
 * se organizan progresivamente como si la IA estuviera aprendiendo
 */
export const aiPatternLearning = (
  container: Element | string | null,
  childSelector: string,
  options?: { delay?: number } & Omit<gsap.TweenVars, 'delay'>
) => {
  if (!container) return;
  
  // Manejar selectores de manera diferente según si container es un elemento DOM o un selector
  let children;
  if (typeof container === 'string') {
    // Si es un selector, podemos usar la combinación normal
    children = gsap.utils.toArray(`${container} ${childSelector}`);
  } else {
    // Si es un elemento DOM, seleccionamos sus hijos directamente
    children = gsap.utils.toArray(container.querySelectorAll(childSelector));
  }
  const tl = gsap.timeline(options);
  
  // Primera fase: elementos desordenados
  tl.from(children, {
    opacity: 0,
    scale: 0.5,
    x: "random(-50, 50)",
    y: "random(-30, 30)",
    rotation: "random(-20, 20)",
    stagger: 0.05,
    duration: 0.6,
  })
  // Segunda fase: organización (simulando aprendizaje)
  .to(children, {
    x: 0,
    y: 0,
    scale: 1, 
    rotation: 0,
    duration: 0.8,
    stagger: 0.03,
    ease: "elastic.out(1, 0.5)",
  });
  
  return tl;
};

/**
 * Efecto de reconocimiento y respuesta, simula cómo una IA
 * reconoce un patrón y responde a él
 */
export const aiRecognitionResponse = (
  triggerElement: Element | string | null,
  responseElements: Element[] | string | null,
  options?: { delay?: number } & Omit<gsap.TweenVars, 'delay'>
) => {
  if (!triggerElement || !responseElements) return;
  
  const tl = gsap.timeline(options);
  
  // Simulación de reconocimiento (escaneo)
  tl.to(triggerElement, {
    boxShadow: "0 0 0 2px rgba(32, 148, 243, 0.7)",
    scale: 1.05,
    duration: 0.5,
    ease: "sine.inOut",
  })
  .to(triggerElement, {
    boxShadow: "0 0 15px 5px rgba(32, 148, 243, 0)",
    scale: 1,
    duration: 0.4,
  })
  // Simulación de respuesta
  .from(responseElements, {
    opacity: 0,
    scale: 0.8,
    y: 10,
    stagger: 0.1,
    duration: 0.6,
    ease: "back.out",
  }, "-=0.2")
  // Asegurar que los elementos de respuesta tengan valores finales correctos
  .to(responseElements, {
    opacity: 1,
    scale: 1,
    y: 0,
    clearProps: "all",
    duration: 0.1
  });
  
  return tl;
};

/**
 * Animación de "decisión adaptativa" - simula el proceso de toma de decisiones de una IA
 * Muestra opciones y luego resalta la "elegida"
 */
export const aiDecisionMaking = (
  options: Element[] | string | null,
  selectedOption: Element | string | null,
  options2?: { delay?: number } & Omit<gsap.TweenVars, 'delay'>
) => {
  if (!options || !selectedOption) return;
  
  const tl = gsap.timeline(options2);
  
  // Mostrar opciones
  tl.from(options, {
    opacity: 0,
    y: 15,
    stagger: 0.1,
    duration: 0.5,
    ease: "power2.out"
  })
  // Pausa para "analizar"
  .to(options, {
    opacity: 0.6,
    scale: 0.98,
    duration: 0.4
  })
  // Resaltar la opción seleccionada
  .to(selectedOption, {
    opacity: 1,
    scale: 1.05,
    boxShadow: "0 0 15px rgba(29, 185, 84, 0.5)",
    duration: 0.6,
    ease: "back.out"
  });
  
  return tl;
};

/**
 * Efecto de "conexión neuronal" que simula cómo las redes neuronales 
 * establecen conexiones entre nodos
 */
export const aiNeuralConnections = (
  nodes: Element[] | string | null,
  connections: Element[] | string | null,
  options?: { delay?: number } & Omit<gsap.TweenVars, 'delay'>
) => {
  if (!nodes || !connections) return;
  
  const tl = gsap.timeline(options);
  
  // Animar primero los nodos
  tl.from(nodes, {
    opacity: 0,
    scale: 0,
    stagger: 0.1,
    duration: 0.5,
    ease: "back.out"
  })
  // Luego animar las conexiones como "sinapsis"
  .from(connections, {
    opacity: 0,
    width: 0,
    // o height: 0 dependiendo de la orientación
    stagger: 0.07,
    duration: 0.4,
    ease: "power1.inOut"
  }, "-=0.3")
  // Efecto de "pulso" para simular actividad pero asegurando visibilidad final
  .to([nodes, connections], {
    opacity: 0.7, 
    repeat: 1,
    yoyo: true,
    stagger: 0.05,
    duration: 0.3
  })
  // Asegurar que todos los elementos sean completamente visibles al final
  .to([nodes, connections], {
    opacity: 1,
    scale: 1,
    clearProps: "all",
    duration: 0.2
  });
  
  return tl;
};

/**
 * Animación de interfaz de IA adaptativa que responde a interacciones
 * Simula como una interfaz impulsada por IA se adapta a las acciones del usuario
 */
export const aiAdaptiveInterface = (
  container: Element | string | null, 
  primaryElements: Element[] | string | null,
  secondaryElements: Element[] | string | null,
  options?: { delay?: number } & Omit<gsap.TweenVars, 'delay'>
) => {
  if (!container || !primaryElements || !secondaryElements) return;
  
  const tl = gsap.timeline(options);
  
  // Preparar el contenedor
  tl.fromTo(container, 
    { opacity: 0.9, scale: 0.98 },
    { opacity: 1, scale: 1, duration: 0.4, ease: "power1.out" }
  )
  // Animar elementos primarios (contenido principal)
  .from(primaryElements, {
    opacity: 0,
    y: 20,
    stagger: { each: 0.1, from: "start" },
    duration: 0.6,
    ease: "power2.out"
  }, "-=0.2")
  // Animar elementos secundarios (contenido recomendado/adaptativo)
  .from(secondaryElements, {
    opacity: 0,
    x: 15,
    stagger: { each: 0.07, from: "random" },
    duration: 0.5,
    ease: "back.out"
  }, "-=0.3")
  // Asegurar visibilidad final de todos los elementos
  .to([primaryElements, secondaryElements], {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    clearProps: "all",
    duration: 0.1
  });
  
  return tl;
};

/**
 * Efecto de procesamiento de datos en tiempo real
 * Simula cómo una IA procesa y visualiza datos continuamente
 */
export const aiRealTimeProcessing = (
  dataPoints: Element[] | string | null,
  options?: {
    duration?: number;
    amplitude?: number;
    frequency?: number;
    onUpdate?: (index: number, progress: number) => void;
    onComplete?: () => void;
    selectedIndex?: number;
  }
) => {
  if (!dataPoints) return;
  
  const items = gsap.utils.toArray(dataPoints);
  const duration = options?.duration || 3;
  const amplitude = options?.amplitude || 15;
  const frequency = options?.frequency || 1;
  
  const tl = gsap.timeline({
    repeat: -1,
    onComplete: options?.onComplete
  });
  
  // Mostrar el punto seleccionado como el "elegido" por la IA
  const selectedIndex = options?.selectedIndex !== undefined ? Number(options.selectedIndex) : Math.floor(Math.random() * items.length);
  let selectedNode = items[selectedIndex];
  
  if (typeof selectedNode === 'string') {
    selectedNode = document.querySelector(selectedNode) as Element;
  }
  
  // Crear animación para cada punto de datos
  items.forEach((item, index) => {
    // Crea una animación con patrón ondulatorio único para cada elemento
    // Simula procesamiento de datos no uniforme
    const delay = index * 0.1;
    const individualDuration = duration * (0.8 + Math.random() * 0.4);
    
    tl.to(item as Element, {
      y: `random(${amplitude * -1}, ${amplitude})`,
      duration: individualDuration / frequency,
      ease: "sine.inOut",
      repeat: 1,
      yoyo: true,
      delay,
      onUpdate: function() {
        if (options?.onUpdate) {
          options.onUpdate(index, this.progress());
        }
      }
    }, index * 0.05);
  });
  
  return tl;
};

// Función para la búsqueda del valor en la matriz 3D
function findValueIn3DMatrix(matrix: number[][][], value: number, activeAxis: number = 0): { x: number, y: number, z: number } | null {
  for (let z = 0; z < matrix.length; z++) {
    for (let y = 0; y < matrix[z].length; y++) {
      for (let x = 0; x < matrix[z][y].length; x++) {
        const axisIndex = [x, y, z][activeAxis];
        const index = matrix[z][y][x];
        if (axisIndex === activeAxis && Number(value) === Number(index)) {
          return { x, y, z };
        }
      }
    }
  }
  return null;
};
