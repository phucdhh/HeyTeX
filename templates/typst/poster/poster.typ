#set page(
  paper: "a0",
  flipped: false,
  margin: (x: 2cm, y: 2cm),
)
#set text(font: "Linux Libertine", size: 24pt)

// Header
#align(center)[
  #text(size: 48pt, weight: "bold")[Your Research Title]
  
  #v(0.5cm)
  
  #text(size: 32pt)[
    Author Name#super[1], Co-author Name#super[2]
  ]
  
  #v(0.3cm)
  
  #text(size: 28pt, style: "italic")[
    #super[1]University Name, #super[2]Institution Name
  ]
]

#line(length: 100%, stroke: 2pt)

#v(1cm)

#grid(
  columns: (1fr, 1fr),
  gutter: 2cm,
  
  // Left Column
  [
    = Introduction
    
    Research background and motivation goes here.
    
    - Key point 1
    - Key point 2
    - Key point 3
    
    #v(1cm)
    
    = Methodology
    
    Describe your methodology here.
    
    *Algorithm:*
    + Step 1
    + Step 2
    + Step 3
    
    #v(1cm)
    
    = Experimental Setup
    
    Details about your experiments.
    
    *Dataset:* Description of dataset \
    *Baseline:* Baseline methods \
    *Metrics:* Evaluation metrics
  ],
  
  // Right Column
  [
    = Results
    
    Present your main results here.
    
    // Add figure
    // #figure(
    //   image("results.png", width: 80%),
    //   caption: [Results comparison]
    // )
    
    Key findings:
    - Finding 1
    - Finding 2
    - Finding 3
    
    #v(1cm)
    
    = Conclusion
    
    Summarize your conclusions.
    
    *Contributions:*
    - Contribution 1
    - Contribution 2
    
    *Future Work:*
    Direction for future research.
    
    #v(1cm)
    
    = References
    
    #text(size: 20pt)[
      [1] Author et al. (2024). Paper title. _Journal_. \
      [2] Another Author (2023). Another paper. _Conference_.
    ]
  ]
)
