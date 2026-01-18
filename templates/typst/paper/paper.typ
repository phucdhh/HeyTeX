#set document(title: "Research Paper", author: "Your Name")
#set page(
  paper: "a4",
  margin: (x: 2.5cm, y: 2.5cm),
  columns: 2,
  numbering: "1",
)
#set text(font: "Linux Libertine", size: 10pt)
#set par(justify: true, first-line-indent: 1em)

// Title and authors
#align(center)[
  #text(size: 16pt, weight: "bold")[Your Research Paper Title]
  
  #v(0.5cm)
  
  #grid(
    columns: (1fr, 1fr),
    gutter: 1cm,
    [
      First Author \
      _Department_ \
      _University Name_ \
      City, Country \
      #link("mailto:email@university.edu")
    ],
    [
      Second Author \
      _Department_ \
      _University Name_ \
      City, Country \
      #link("mailto:email2@university.edu")
    ]
  )
]

#v(0.5cm)

// Abstract
#align(center)[
  #text(weight: "bold")[ABSTRACT]
]

#text(style: "italic")[
  This is the abstract of your paper. Provide a concise summary of the background, methods, results, and conclusions. Keep it between 150-250 words.
]

#v(0.3cm)

*Keywords:* keyword1, keyword2, keyword3, keyword4

#v(0.5cm)

= Introduction

Introduction to your research problem and motivation.

== Background

Background information and related context.

== Contributions

The main contributions of this paper are:
- Contribution 1
- Contribution 2
- Contribution 3

= Related Work

Discussion of previous research in the field.

= Methodology

== Problem Formulation

Formal definition of the problem you are solving.

== Proposed Approach

Description of your proposed method or algorithm.

= Experiments

== Experimental Setup

Description of datasets, baselines, and evaluation metrics.

== Results

Present your experimental results here.

#figure(
  table(
    columns: 3,
    [*Method*], [*Metric 1*], [*Metric 2*],
    [Baseline], [0.85], [0.78],
    [Ours], [*0.92*], [*0.89*],
  ),
  caption: [Results Comparison]
)

== Analysis

Analysis and discussion of the results.

= Conclusion

Summary of the work and future directions.

= Acknowledgments

Optional acknowledgments section.

= References

[1] Author, F. and Author, S. (2024). "Example Paper Title". _Journal Name_, 15(3), 123--145.

[2] Smith, J. and Doe, J. (2023). "Conference Paper Example". In _Proceedings of International Conference_, pp. 456--467.
