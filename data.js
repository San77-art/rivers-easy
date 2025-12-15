const products = [
    {
        id: 1,
        name: "Afeef",
        brand: "Lattafa",
        price: 375.00,
        category: "feminino",
        image: "images/afeef.jpg",
        sizes: ["100ml"],
        description: "O Lattafa Afeef é um perfume unissex lançado em 2024, descrito como uma fragrância oriental, versátil e sofisticada. Sua composição combina notas de topo frutadas e especiadas (pêssego, pimenta rosa e bergamota), um coração floral elegante (tuberosa, flor de laranjeira e jasmim) e uma base quente e doce (sândalo, pralinê, âmbar e patchouli). "
    },
    {
        id: 2,
        name: "Asad",
        brand: "Lattafa",
        price: 225.00,
        category: "masculino",
        image: "images/asad.jpg.jpg",
        sizes: ["100ml"],
        description: "Lattafa Asad é um perfume masculino oriental amadeirado com notas de topo de pimenta preta, tabaco e abacaxi; notas de coração de patchouli, café e íris; e notas de fundo de baunilha, âmbar, benjoim, madeira seca e ládano. Lançado em 2021, é um Eau de Parfum de longa duração, ideal para uso noturno e em ocasiões especiais, projetado para homens modernos, sofisticados e que buscam uma fragrância marcante. "
    },
    {
        id: 3,
        name: "Fakhar Rose",
        brand: "Lattafa",
        price: 250.00,
        category: "feminino",
        image: "images/fakharwomen.jpg",
        sizes: ["100ml"],
        description: "O Lattafa Fakhar Rose é um perfume feminino floral oriental, lançado em 2022, com um aroma marcante e sofisticado que celebra a rosa. Sua fragrância abre com notas de frutas, lírio, romã e aldeídos, evolui para um buquê floral com jasmim, gardênia, ylang-ylang, madressilva, rosa e peônia, e finaliza com uma base doce e amadeirada de baunilha, almíscar branco, ambroxan e sândalo. "
    },
    {
        id: 4,
        name: "Fakhar Black",
        brand: "Lattafa",
        price: 250.00,
        category: "masculino",
        image: "images/fakharblack.jpg",
        sizes: ["100ml"],
        description: "O Lattafa Fakhar Black é um perfume masculino âmbar lançado em 2022, com notas de topo de maçã, bergamota e gengibre; notas de coração de lavanda, sálvia, zimbro e gerânio; e notas de fundo de fava tonka, madeira de âmbar, cedro e vetiver. Essa combinação cria uma fragrância intensa, aromática, amadeirada e especiada, considerada versátil para uso diário ou ocasiões especiais. "
    },
    {
        id: 5,
        name: "Durrat Al Aroos",
        brand: "Al Wataniah",
        price: 250.00,
        category: "feminino",
        image: "images/durrat.jpg.jpg",
        sizes: ["85ml"],
        description: "Durrat Al Aroos é um perfume feminino árabe oriental e almiscarado, lançado em 2022 pela marca Al Wataniah. O nome significa A Pérola ou O encanto da Noiva, e a fragrância é descrita como sofisticada e elegante, com uma mistura de notas de orquídea, baunilha, cumaru e almíscar, combinadas com toques sedutores de sândalo e âmbar." 
    },
    {
        id: 6,
        name: "Club de Nuit Intense Man",
        brand: "Armaf",
        price: 375.00,
        category: "masculino",
        image: "images/clubdenuitintenseman.jpg",
        sizes: ["105ml"],
        description: "O Club de Nuit Intense Man da Armaf é um perfume amadeirado especiado para homens, conhecido por sua fragrância forte e duradoura. Sua composição abre com notas cítricas e frutadas (limão, abacaxi, bergamota, groselha preta, maçã), evolui para um coração de bétula, jasmim e rosa, e finaliza com uma base quente e rica de patchouli, baunilha, âmbar cinzento e almíscar. É frequentemente descrito como ideal para ocasiões noturnas ou especiais, com excelente projeção. "
    },
    {
        id: 7,
        name: "Yara Rose",
        brand: "Lattafa",
        price: 250.00,
        category: "feminino",
        image: "images/yararose.jpeg",
        sizes: ["100ml"],
        description: "O perfume Yara Rose da Lattafa é uma fragrância feminina, descrita como floral, romântica e elegante, com notas de topo de orquídea, heliotrópio e tangerina. O coração da fragrância é um acorde floral de diferentes tipos de rosas, com toques gourmands e de frutas tropicais. A base é composta por notas mais quentes, como madeiras suaves, baunilha, almíscar e sândalo, que proporcionam um rastro duradouro e envolvente. "
    },
    {
        id: 8,
        name: "One Million",
        brand: "Paco Rabanne",
        price: 675.00,
        category: "masculino",
        image: "images/onemillion.jpg.jpg",
        sizes: ["100ml"],
        description: "One Million é pura sedução. Notas de canela, couro e madeiras brancas criam uma fragrância intensa e magnética para homens confiantes."
    }
];

const brands = [
    { name: "Armaf", count: 15 },
    { name: "Lattafa", count: 12 },
    { name: "Al Wataniah", count: 10 },
    { name: "Paco Rabanne", count: 8 },
    { name: "Afnan", count: 9 },
    { name: "Carolina Herrera", count: 7 },
    { name: "French Avenue", count: 11 },
    { name: "Orientica", count: 13 }
];
