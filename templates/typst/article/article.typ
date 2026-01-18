#set document(title: "Your Article Title", author: "Author Name")
#set page(paper: "a4", margin: (x: 2.5cm, y: 2.5cm))
#set text(font: "Linux Libertine", size: 11pt)
#set par(justify: true)

#align(center)[
  #text(size: 17pt, weight: "bold")[Your Article Title]
  
  #v(0.5cm)
  
  Author Name#super[1]
  
  #text(size: 10pt, style: "italic")[
    #super[1]Affiliation, University Name
  ]
  
  #v(0.3cm)
  
  #text(size: 10pt)[#link("mailto:author@example.com")]
  
  #v(1cm)
]

= Abstract

#text(style: "italic")[
  This is the abstract of your article. Provide a brief summary of your work, including the motivation, methods, results, and conclusions. Keep it concise, typically 150-250 words.
]

#v(0.5cm)

*Keywords:* keyword1, keyword2, keyword3

#v(1cm)

= Introduction

Introduction text goes here. Explain the background and motivation for your work.

= Related Work

Discussion of related work and previous research in the field.

= Methodology

Describe your methodology and approach to the problem.

= Results

Present your results and findings.

== Subsection Example

You can use subsections to organize your content.

= Discussion

Discuss the implications of your results.

= Conclusion

Conclude your article and suggest future work.

= References

#bibliography("references.bib")
