const NODES = [
    { id:"n1", corto:"Colapso de la red vial local y arterial", full:"Colapso de la red vial local y de los corredores arteriales", color:"#5b8ad6" },
    { id:"n2", corto:"Contaminación de la red hídrica", full:"Contaminación y alteración biofísica de la red hídrica y cuerpos de agua", color:"#d669a8" },
    { id:"n3", corto:"Concentración del mercado mayorista", full:"Concentración metropolitana del mercado mayorista de alimentos en la trama barrial", color:"#e2635a" },
    { id:"n4", corto:"Sobrecarga por densificación en altura", full:"Sobrecarga infraestructural de la densificación residencial en altura", color:"#9b7ede" },
    { id:"n5", corto:"Interferencia en el espacio público", full:"Interferencia de actividades logísticas en la red de espacio público barrial", color:"#4caf7d" },
    { id:"n6", corto:"Acumulación de residuos y transporte pesado", full:"Acumulación de residuos y transporte pesado sobre la red ecológica", color:"#e8a33d" },
    { id:"n7", corto:"Inoperancia del ordenamiento oficial", full:"Inoperancia del ordenamiento oficial ante los patrones reales del territorio", color:"#45b8c4" },
  ];
const LINKS = [
    { from:"n7", to:"n3", pol:"+", verbo:"Al no comprender ni regular las dinámicas reales del suelo, la norma pública permite que una función de escala regional continúe hiperconcentrándose dentro de un entorno barrial." },
    { from:"n7", to:"n4", pol:"+", verbo:"La rigidez normativa aprueba licencias de construcción en altura sin exigir ni garantizar la expansión previa de las redes matrices de servicios públicos e infraestructura." },
    { from:"n3", to:"n5", pol:"+", verbo:"El ingreso diario de más de 11.500 toneladas de alimentos y 12.000 vehículos (1.500 camiones pesados) supera la capacidad interna de absorción de la central, desplazando el parqueo y el cargue/descargue hacia andenes y vías barriales." },
    { from:"n3", to:"n6", pol:"+", verbo:"La alta producción de desechos orgánicos y la intensidad del transporte pesado presionan directamente los bordes de la franja ambiental y del Humedal La Vaca." },
    { from:"n5", to:"n1", pol:"+", verbo:"Camiones y carretas estacionados en calzadas reducen la capacidad operativa de las vías de una sola calzada, bloqueando el tráfico local y arterial." },
    { from:"n4", to:"n2", pol:"+", verbo:"El vertiginoso aumento de habitantes en torre sobrepasa la capacidad del alcantarillado, incrementando vertimientos sin tratamiento sobre la red hídrica." },
    { from:"n4", to:"n1", pol:"+", verbo:"La sobrecarga por densificación en altura genera una alta concentración de viajes cotidianos que se vuelcan sobre la trama vial barrial y arterial, acelerando el colapso de la red vial." },
    { from:"n6", to:"n2", pol:"+", verbo:"El vertimiento de lixiviados y la acumulación de basura en los bordes naturales contaminan los canales superficiales y el cuerpo de agua del humedal." },
    { from:"n1", to:"n3", pol:"-", loop:true, loopLabel:"B1", verbo:"A medida que la concentración comercial crece, desborda el espacio público y provoca el colapso vial total. Sin embargo, la extrema congestión y el embotellamiento en las puertas de acceso generan bloqueos de varias horas que impiden la entrada fluida de nuevos camiones, actuando como un freno o autorregulación negativa que estrangula temporalmente la misma operatividad de la central." },
    { from:"n5", to:"n7", pol:"+", loop:true, loopLabel:"R1", verbo:"La inoperancia de la norma permite la hiperconcentración, que satura el espacio público mediante actividades informales. Entre más se consolidan estas prácticas sobre la calle, la regla oficial se vuelve más obsoleta e inaplicable, profundizando y alimentando la inoperancia del ordenamiento oficial." },
    { from:"n2", to:"n4", pol:"-", loop:true, loopLabel:"B2", verbo:"La acumulación de residuos y pasivos ambientales degrada los cuerpos de agua. Este deterioro ambiental severo y la falta de salubridad actúan como un límite biótico que agota la capacidad de soporte del territorio frente a la sobrecarga residencial en altura." },
  ];
