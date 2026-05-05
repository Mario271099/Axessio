-- ============================================================================
-- Axessio · Méthodologie WCAG 2.2 — section "Intent" par critère
-- ----------------------------------------------------------------------------
-- Source officielle : https://www.w3.org/WAI/WCAG22/Understanding/
-- (W3C Software and Document License — réutilisation libre avec attribution)
--
-- Pour chacun des 86 critères WCAG 2.2 (référentiel
-- 33333333-3333-3333-3333-333333333333), on remplit la colonne `methodology`
-- avec la section "Intent" extraite de la page Understanding correspondante.
-- Contenu en anglais uniquement → préfixe « [EN] » sur chaque entrée.
--
-- Idempotent · à exécuter en transaction unique.
-- Vérification finale : exception si moins de 80 critères remplis.
-- ============================================================================

begin;

-- ============================================================================
-- 1.1 Équivalents textuels
-- ============================================================================

update public.criteria set methodology = '[EN] The intent of this success criterion is to make information conveyed by non-text content accessible through the use of a text alternative. Text alternatives are a primary way for making information accessible because they can be rendered through any sensory modality (for example, visual, auditory or tactile) to match the needs of the user. Providing text alternatives allows the information to be rendered in a variety of ways by a variety of user agents. For example, people who cannot see a picture can have the text alternative read aloud using synthesized speech. People who cannot hear an audio file can have the text alternative displayed so that they can read it.

Non-text content can take a number of forms, and this success criterion specifies how each is to be handled: non-text content covered by other situations (charts, diagrams, audio recordings, pictures, animations); non-text content that is a control or accepts user input; non-text content that is time-based media; live audio-only and live video-only content; tests or exercises that must be presented in non-text format; sensory experiences; CAPTCHAs; and decorative or invisible non-text content. […]'
where identifier = '1.1.1' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

-- ============================================================================
-- 1.2 Média temporel
-- ============================================================================

update public.criteria set methodology = '[EN] The intent of this success criterion is to make information conveyed by prerecorded audio-only and prerecorded video-only content available to all users. Alternatives for time-based media that are text based make information accessible because text can be rendered through any sensory modality (for example, visual, auditory or tactile) to match the needs of the user. In the future, text could also be translated into symbols, sign language or simpler forms of the language.

An example of pre-recorded video with no audio information or user interaction is a silent movie. The purpose of the transcript is to provide an equivalent to what is presented visually. For prerecorded video content, authors have the option to provide an audio track. The purpose of the audio alternative is to be an equivalent to the video. This makes it possible for users with and without vision impairment to review content simultaneously. The approach can also make it easier for those with cognitive, language and learning disabilities to understand the content because it would provide parallel presentation.

A text equivalent is not required for audio that is provided as an equivalent for video with no audio information.'
where identifier = '1.2.1' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to enable people who are deaf or hard of hearing to watch synchronized media presentations. Captions provide the part of the content available via the audio track. Captions not only include dialogue, but identify who is speaking and include non-speech information conveyed through sound, including meaningful sound effects.

It is acknowledged that at the present time there may be difficulty in creating captions for time-sensitive material and this may result in the author being faced with the choice of delaying the information until captions are available, or publishing time-sensitive content that is inaccessible to the deaf, at least for the interval until captions are available. Over time, the tools for captioning as well as building the captioning into the delivery process can shorten or eliminate such delays.

Captions are not needed when the synchronized media is, itself, an alternate presentation of information that is also presented via text on the web page.'
where identifier = '1.2.2' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to provide people who are blind or visually impaired access to the visual information in a synchronized media presentation in the same human language as the video or page on which it appears. This success criterion describes two approaches, either of which can be used.

One approach is to provide audio description of the video content. The audio description augments the audio portion of the presentation with the information needed when the video portion is not available. During existing pauses in dialogue, audio description provides information about actions, characters, scene changes, and on-screen text that are important and are not described or spoken in the main sound track.

The second approach involves providing all of the information in the synchronized media (both visual and auditory) in text form. An alternative for time-based media provides a running description of all that is going on in the synchronized media content. The alternative for time-based media reads something like a screenplay or book.

If there is any interaction as part of the synchronized media presentation then the alternative for time-based media would provide hyperlinks or whatever is needed to provide the same functionality.'
where identifier = '1.2.3' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to enable people who are deaf or hard of hearing to watch real-time presentations. Captions provide the part of the content available via the audio track. Captions not only include dialogue, but also identify who is speaking and notate sound effects and other significant audio.

This success criterion was intended to apply to broadcast of synchronized media and is not intended to require that two-way multimedia calls between two or more individuals through web apps must be captioned regardless of the needs of users. Responsibility for providing captions would fall to the content providers (the callers) or the "host" caller, and not the application.'
where identifier = '1.2.4' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to provide people who are blind or visually impaired access to the visual information in a synchronized media presentation in the same human language as the video or page on which it appears. The audio description augments the audio portion of the presentation with the information needed when the video portion is not available. During existing pauses in dialogue, audio description provides information about actions, characters, scene changes, and on-screen text that are important and are not described or spoken in the main sound track.

For 1.2.3, 1.2.5, and 1.2.7, if all of the important information in the video track is already conveyed in the audio track, no additional audio description is necessary.'
where identifier = '1.2.5' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to enable people who are deaf or hard of hearing and who are fluent in a sign language to understand the content of the audio track of synchronized media presentations. Written text, such as that found in captions, is often a second language. Because sign language provides the ability to provide intonation, emotion and other audio information that is reflected in sign language interpretation, but not in captions, sign language interpretation provides richer and more equivalent access to synchronized media. People who communicate extensively in sign language are also faster in sign language and synchronized media is a time-based presentation.'
where identifier = '1.2.6' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to provide people who are blind or visually impaired access to a synchronized media presentation beyond that which can be provided by standard audio description. This is done by periodically freezing the synchronized media presentation and playing additional audio description. The synchronized media presentation is then resumed.

Because it disrupts viewing for those who do not need the additional description, techniques that allow you to turn the feature on and off are often provided. Alternately, versions with and without the additional description can be provided.'
where identifier = '1.2.7' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to make audio visual material available to individuals whose vision is too poor to reliably read captions and whose hearing is too poor to reliably hear dialogue and audio description. This is done by providing an alternative for time-based media in the same human language as the video or page on which it appears.

This approach involves providing all of the information in the synchronized media (both visual and auditory) in text form. An alternative for time-based media provides a running description of all that is going on in the synchronized media content. The alternative for time-based media reads something like a book. Unlike audio description, the description of the video portion is not constrained to just the pauses in the existing dialogue. Full descriptions are provided of all visual information, including visual context, actions and expressions of actors, and any other visual material. In addition, non-speech sounds (laughter, off-screen voices, etc.) are described, and transcripts of all dialogue are included.

Individuals whose vision is too poor to reliably read captions and whose hearing is too poor to reliably hear dialogue can access the alternative for time-based media by using a refreshable braille display.'
where identifier = '1.2.8' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to make information conveyed by live audio, such as web-based audio conferencing, live speeches and radio Webcasts, accessible through the use of a text alternative. A live text caption service will enable live audio to be accessible to people who are deaf or hard of hearing, or who cannot otherwise hear the audio. Such services use a trained human operator who listens in to what is being said and uses a special keyboard to enter the text with only a small delay. They are able to capture a live event with a high degree of fidelity, and also to insert notes on any non spoken audio which is essential to understanding the event. A transcript is sometimes a possibility if the live audio is following a set script; but a live caption service is preferred because it plays out at the same pace as the audio itself, and can adapt to any deviations from the script that might occur.

Using untrained operators, or providing a transcript which differs markedly from what actually happens would not be considered meeting this success criterion.'
where identifier = '1.2.9' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

-- ============================================================================
-- 1.3 Adaptable
-- ============================================================================

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure that information and relationships that are implied by visual or auditory formatting are preserved when the presentation format changes. For example, the presentation format changes when the content is read by a screen reader or when a user style sheet is substituted for the style sheet provided by the author.

Sighted users perceive structure and relationships through various visual cues — headings are often in a larger, bold font separated from paragraphs by blank lines; list items are preceded by a bullet and perhaps indented; paragraphs are separated by a blank line; items that share a common characteristic are organized into tabular rows and columns; form fields may be positioned as groups that share text labels; a different background color may be used to indicate that several items are related to each other; words that have special status are indicated by changing the font family and/or bolding, italicizing, or underlining them. Having these structures and these relationships programmatically determined or available in text ensures that information important for comprehension will be perceivable to all.

When such relationships are perceivable to one set of users, those relationships can be made to be perceivable to all. Some technologies do not provide a means to programmatically determine some types of information and relationships. In that case then there should be a text description of the information and relationships.'
where identifier = '1.3.1' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to enable a user agent to provide an alternative presentation of content while preserving the reading order needed to understand the meaning. It is important that it be possible to programmatically determine at least one sequence of the content that makes sense. Content that does not meet this Success Criterion may confuse or disorient users when assistive technology reads the content in the wrong order, or when alternate style sheets or other formatting changes are applied.

A sequence is meaningful if the order of content in the sequence cannot be changed without affecting its meaning. For example, if a page contains two independent articles, the relative order of the articles may not affect their meaning, as long as they are not interleaved. In such a situation, the articles themselves may have meaningful sequence, but the container that contains the articles may not have a meaningful sequence.

The order of content in a sequence is not always meaningful. For example, the relative order of the main section of a web page and a navigation section does not affect their meaning. They could occur in either order in the programmatically determined reading sequence.

For clarity: providing a particular linear order is only required where it affects meaning; there may be more than one order that is "correct"; only one correct order needs to be provided.'
where identifier = '1.3.2' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure that all users can access instructions for using the content, even when they cannot perceive shape or size or use information about spatial location or orientation. Some content relies on knowledge of the shape or position of objects that are not available from the structure of the content (for example, "round button" or "button to the right"). Some users with disabilities are not able to perceive shape or position due to the nature of the assistive technologies they use. This success criterion requires that additional information be provided to clarify instructions that are dependent on this kind of information.

Providing information using shape and/or location, however, is an effective method for many users including those with cognitive limitations. This provision should not discourage those types of cues as long as the information is also provided in other ways.

In some languages, it is commonly understood that "above" refers to the content previous to that point in the content and "below" refers to the content after that point. In such languages, if the content being referenced is in the appropriate place in the reading order and the references are unambiguous, statements such as "choose one of the links below" or "all of the above" would conform to this success criterion.'
where identifier = '1.3.3' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure that content displays in the orientation (portrait or landscape) preferred by the user. Some websites and applications automatically set and restrict the screen to a particular display orientation and expect that users will respond by rotating their device to match, but this can create problems. Some users have their devices mounted in a fixed orientation (e.g. on the arm of a power wheelchair). Therefore, websites and applications need to support both orientations by not restricting the orientation. Changes in content or functionality due to the size of display are not covered by this criterion which is focused on restrictions of orientation.

Historically, devices tended to have a fixed-orientation display, and all content was created to match that display orientation. Today, most handhelds and many other devices have a hardware-level ability to dynamically adjust default display orientation based on sensor information. The goal of this success criterion is that authors should never restrict content''s orientation, thus ensuring that it always match the device display orientation.

The exception for things considered essential is aimed at situations where the content would only be understood in a particular orientation, or where the technology restricts the possible orientations.'
where identifier = '1.3.4' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure that the purpose of a form input collecting information about the user can be programmatically determined, so that user agents can extract and present this purpose to users using different modalities. The ability to programmatically declare the specific kind of data expected in a particular field makes filling out forms easier, especially for people with certain cognitive disabilities.

Appropriate visible labels and instruction can help users understand the purpose of form input fields, but users may benefit from having fields that collect specific types of information be rendered in an unambiguous, consistent, and possibly customized way for different modalities - either through defaults in their user agent, or through the aid of assistive technologies.

The HTML autocomplete attribute only accepts a certain number of specific well-defined fixed values. This allows a more fine-grained definition or identification of purpose than the type attribute. By adopting and repurposing this predefined taxonomy of definitions, user agents and assistive technologies can now present the purpose of the inputs to users in different modalities. For example, assistive technologies may display familiar icons next to input fields to help users who have difficulties reading.

In addition to repurposing this taxonomy, when the autocomplete attribute technique is used to meet this Success Criterion, browsers and other user agents can suggest and autofill the right content by autocompleting these fields based on past user input stored in the browser. […]'
where identifier = '1.3.5' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure that the purpose of many elements on a page can be programmatically determined, so that user agents can extract and present that purpose to users using different modalities.

Many users with limited vocabularies rely on familiar terms or symbols in order to use the web. However, what is familiar to one user may not be familiar to another. When authors indicate the purpose, users can take advantage of personalization and user preferences to load a set of symbols or vocabulary familiar to them.

This success criterion requires the author to programmatically associate the purpose of icons, regions and components (such as buttons, links, and fields) so that user agents can determine the purpose of each and adapt indicators or terminology to make them understandable for the user. It is achieved by adding semantics or metadata that provide this context.

Identifying regions of the page allows people to remove or highlight regions with their user agent.

Products for people who are non-vocal often use symbols to help users communicate. These symbols are in fact people''s language. This Success Criterion enables symbols to be interoperable so that symbol users can understand different content that was not just made by one company.'
where identifier = '1.3.6' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

-- ============================================================================
-- 1.4 Distinguable
-- ============================================================================

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure that all sighted users can access information that is conveyed by color differences, that is, by the use of color where each color has a meaning assigned to it. If the information is conveyed through color differences in an image (or other non-text format), the color may not be seen by users with color deficiencies. In this case, providing the information conveyed with color through another visual means ensures users who cannot see color can still perceive the information.

Color is an important asset in the design of web content, enhancing its aesthetic appeal, its usability, and its accessibility. However, some users have difficulty perceiving color. People with partial sight often experience limited color vision, and many older users do not see color well. In addition, people using limited-color or monochrome displays and browsers will be unable to access information that is presented only in color.

Examples of information conveyed by color differences: "required fields are red", "error is shown in red". This should not in any way discourage the use of color on a page, or even color coding if it is complemented by other visual indication. […]'
where identifier = '1.4.1' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] Individuals who use screen reading software can find it hard to hear the speech output if there is other audio playing at the same time. This difficulty is exacerbated when the screen reader''s speech output is software based (as most are today) and is controlled via the same volume control as the sound. Therefore, it is important that the user be able to turn off the background sound.

Having control of the volume includes being able to reduce its volume to zero. Muting the system volume is not "pausing or stopping" the autoplay audio. Both the "pause or stop" and control of audio volume need to be independent of the overall system volume.

Playing audio automatically when landing on a page may affect a screen reader user''s ability to find the mechanism to stop it because they navigate by listening and automatically started sounds might interfere with that navigation. Therefore, we discourage the practice of automatically starting sounds (especially if they last more than 3 seconds), and encourage that the sound be started by an action initiated by the user after they reach the page.'
where identifier = '1.4.2' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to provide enough contrast between text and its background, so that it can be read by people with moderately low vision or impaired contrast perception, without the use of contrast-enhancing assistive technology.

For all consumers of visual content, adequate light-dark contrast is needed between the relative luminance of text and its background for good readability. Many different visual impairments can substantially impact contrast sensitivity, requiring more light-dark contrast, regardless of color (hue). For people with color vision deficiency who are not able to distinguish certain shades of color, hue and saturation have minimal or no effect on legibility as assessed by reading performance.

Text that is decorative and conveys no information is excluded. Text that is larger and has wider character strokes is easier to read at lower contrast. The contrast requirement for larger text is therefore lower. 18 point text or 14 point bold text is judged to be large enough to require a lower contrast ratio.

The contrast requirements for text also apply to images of text. This requirement applies to situations in which images of text were intended to be understood as text. Incidental text, such as in photographs that happen to include a street sign, are not included. […]'
where identifier = '1.4.3' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure that visually rendered text, including controls and labels using text, can be made larger so that it can be read more easily by people with milder visual impairments, without requiring the use of assistive technology (such as a screen magnifier). Users may benefit from scaling all content on the web page, but text is most critical.

The scaling of content is primarily a user agent responsibility. User agents that satisfy UAAG 1.0 Checkpoint 4.1 allow users to configure text scale through a number of mechanisms - including zoom (of the entire page''s content), magnification, text-only resizing, and allowing the user to configure a size for rendered text. The author''s responsibility is to create web content that does not prevent the user agent from scaling the content effectively.

Content satisfies the success criterion if it can be scaled up to 200% using at least one text scaling mechanism supported by user agents.

If the author is using a technology whose user agents do not provide support for specific text scaling mechanisms, the author is responsible for providing this type of functionality directly, or providing content that works with the type of functionality provided by the user agent. […]'
where identifier = '1.4.4' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to encourage authors, who are using technologies which are capable of achieving their desired default visual presentation, to enable people who require a particular visual presentation of text to be able to adjust the text presentation as needed. This includes people who require the text in a particular font size, foreground and background color, font family, line spacing or alignment.

If authors can use text to achieve the same visual effect, they should present the information as text rather than using an image. If for any reason, the author cannot format the text to get the same effect, the effect won''t be reliably presented on the commonly available user agents, or using a technology to meet this criterion would interfere with meeting other criteria such as 1.4.4, then an image of text can be used. This includes instances where a particular presentation of text is essential to the information being conveyed, such as type samples, logotypes, branding, etc.

The success criterion is intended to address situations where images of text are used rather than text. Where images of text are used in addition to text to convey the same information, and where both are presented to the user, this success criterion is met.'
where identifier = '1.4.5' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to provide enough contrast between text and its background so that it can be read by people with moderately low vision (who do not use contrast-enhancing assistive technology). For people without color deficiencies, hue and saturation have minimal or no effect on legibility as assessed by reading performance. Color deficiencies can affect luminance contrast somewhat. Therefore, in the recommendation, the contrast is calculated in such a way that color is not a key factor so that people who have a color vision deficit will also have adequate contrast between the text and the background.

Text that is decorative and conveys no information is excluded. Text that is larger and has wider character strokes is easier to read at lower contrast. The contrast requirement for larger text is therefore lower. This allows authors to use a wider range of color choices for large text, which is helpful for design of pages, particularly titles. 18 point text or 14 point bold text is judged to be large enough to require a lower contrast ratio.

The contrast ratio of 7:1 was chosen for level AAA because it compensated for the loss in contrast sensitivity usually experienced by users with vision loss equivalent to approximately 20/80 vision. […]'
where identifier = '1.4.6' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure that any non-speech sounds are low enough that a user who is hard of hearing can separate the speech from background sounds or other noise foreground speech content.

The value of 20 dB was chosen based on Large area assistive listening systems (ALS): Review and recommendations [LAALS] and In-the-ear measurements of interference in hearing aids from digital wireless telephones [HEARING-AID-INT].'
where identifier = '1.4.7' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure that visually rendered text is presented in such a manner that it can be perceived without its layout interfering with its readability. People with some cognitive, language and learning disabilities and some low vision users cannot perceive the text and/or lose their reading place if the text is presented in a manner that is difficult for them to read.

People with some visual or cognitive disabilities need to be able to select the color of text and the color of the background. They sometimes choose combinations that seem unintuitive to someone without that disability. Sometimes these combinations have very low contrast. Sometimes only very specific color combinations work for them. Control of color or other aspects of text presentation makes a huge difference to their comprehension.

For people with some reading or vision disabilities, long lines of text can become a significant barrier. They have trouble keeping their place and following the flow of text. Having a narrow block of text makes it easier for them to continue on to the next line in a block. Lines should not exceed 80 characters or glyphs (40 if CJK). People with some cognitive disabilities find it difficult to track text where the lines are close together. Providing extra space between lines and paragraphs allows them to better track the next line. […]'
where identifier = '1.4.8' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to enable people who require a particular visual presentation of text to be able to adjust the text presentation as required. This includes people who require the text in a particular font size, foreground and background color, font family, line spacing or alignment.

This means implementing the text in a manner that allows its presentation to be changed or providing a mechanism by which users can select an alternate presentation. Using images of text is an example of an implementation that does not allow users to alter the presentation of the text within it.

In some situations, a particular visual presentation of the text is essential to the information being conveyed. This means that information would be lost without that particular visual presentation. In this case implementing the text in a manner that allows its presentation to be changed is not required. This includes text that demonstrates a particular visual aspect of the text, such as a particular font family, or text that conveys an identity, such as text within a company logo.

Text that is decorative does not require implementing the text in a manner that allows its presentation to be changed.'
where identifier = '1.4.9' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to let users enlarge text and other related content without having to scroll in two dimensions to read. When lines of text extend beyond the edge of a viewport, users will be forced to scroll back-and-forth to read line by line. This can cause them to lose their place and can significantly increase both physical and cognitive effort. Therefore, most sections of content are expected to reflow within the appropriate sizing requirement defined by this success criterion.

A section of content that requires two-dimensional layout for understanding or functionality, such as a table or map, has an exception to this success criterion. However, sections of content within the two-dimensional layout, such as each cell within a table, would still need to meet this success criterion. Although there is an exception for sections of content that require two-dimensional layout for understanding or functionality, authors can improve the user''s experience by making efforts to reduce scrolling for that type of content.'
where identifier = '1.4.10' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure that user interface components (i.e., controls) and meaningful graphics are distinguishable by people with moderately low vision. The requirements and rationale are similar to those for large text in 1.4.3 Contrast (Minimum). Note that this requirement does not apply to inactive user interface components.

Low contrast controls are more difficult to perceive, and may be completely missed by people with a visual impairment. Similarly, if a graphic is needed to understand the content or functionality of the web page then it should be perceivable by people with low vision or other impairments without the need for contrast-enhancing assistive technology.

The 3:1 contrast ratios referenced in this success criterion is intended to be treated as threshold values. Because authors do not have control over user settings for font smoothing and anti-aliasing, when evaluating this Success Criterion, refer to the colors obtained from the user agent, or the underlying markup and stylesheets, rather than the non-text elements as presented on screen.'
where identifier = '1.4.11' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure that when people override author-specified text spacing to improve their reading experience, content is still readable and operable. Each of the requirements stipulated in the SC''s four bullets helps ensure text styling can be adapted by the user to suit their needs.

The metrics set a target for a minimum for text spacing that must be met. Starting from the author''s presentation, changing these four style properties to the specified values should not result in a loss of content or functionality.

This SC focuses on the adaptability of content to a change in spacing between lines, words, letters, and paragraphs. Any combination of these may assist a user with effectively reading text. As well, ensuring that content correctly adapts when users override author settings for spacing also significantly increases the likelihood other style preferences can be set by the user.

This SC does not dictate that authors must set all their content to the specified metrics, or provide a mechanism to do so. Rather, it specifies that an author''s content has the ability to be set to those metrics without loss of content or functionality. The author requirement is both to not interfere with a user''s ability to override the author settings, and to ensure that content thus modified does not break content. […]'
where identifier = '1.4.12' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] Additional content that appears and disappears in coordination with keyboard focus or pointer hover often leads to accessibility issues. Reasons for such issues include: the user may not have intended to trigger the interaction; the user may not know new content has appeared; the new content may interfere with a user''s ability to do a task.

Examples of such interactions can include custom tooltips, sub-menus and other non-modal popups which display on hover and focus. The intent of this success criterion is to ensure that authors who cause additional content to appear and disappear in this manner must design the interaction in such a way that users can perceive the additional content AND dismiss it without disrupting their page experience.

There are usually more predictable and accessible means of adding content to the page. If an author does choose to make additional content appear and disappear in coordination with hover and keyboard focus, this success criterion specifies three conditions that must be met: dismissible, hoverable, and persistent.'
where identifier = '1.4.13' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

-- ============================================================================
-- 2.1 Accessibilité au clavier
-- ============================================================================

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure that, wherever possible, content can be operated through a keyboard or keyboard interface (so an alternate keyboard can be used). When content can be operated through a keyboard or alternate keyboard, it is operable by people with no vision (who cannot use devices such as mice that require eye-hand coordination) as well as by people who must use alternate keyboards or input devices that act as keyboard emulators. Keyboard emulators include speech input software, sip-and-puff software, on-screen keyboards, scanning software and a variety of assistive technologies and alternate keyboards. Individuals with low vision also may have trouble tracking a pointer and find the use of software much easier (or only possible) if they can control it from the keyboard.

Examples of "specific timings for individual keystrokes" include situations where a user would be required to repeat or execute multiple keystrokes within a short period of time or where a key must be held down for an extended period before the keystroke is registered.

The phrase "except where the underlying function requires input that depends on the path of the user''s movement and not just the endpoints" is included to separate those things that cannot reasonably be controlled from a keyboard.'
where identifier = '2.1.1' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure that that content does not "trap" keyboard focus within subsections of content on a web page. This is a common problem when multiple formats are combined within a page and rendered using plug-ins or embedded applications.

There may be times when the functionality of the web page restricts the focus to a subsection of the content, as long as the user knows how to leave that state and "untrap" the focus.'
where identifier = '2.1.2' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure that all content is operable from the keyboard. This is the same as Success Criterion 2.1.1, except that no exceptions are allowed. This does not mean that content where the underlying function requires input that depends on the path of the user''s movement and not just the endpoints (excluded from the requirements of 2.1.1) must be made keyboard accessible. Rather, it means that content that uses path-dependent input cannot conform to this success criterion and therefore cannot meet Guideline 2.1 at Level AAA.

Platforms and user agents usually have conventions for how web content or applications are controlled with a keyboard interface. If content does not follow the platform/user agent conventions it may be difficult to use, as users will need to learn different interaction methods. As a best practice, content should follow the platform/user agent conventions. However, deviating from these conventions does not fail the normative requirement of this success criterion.

This success criterion does not require that every visible control that can be activated using a pointer must also be focusable and actionable using the keyboard. The normative requirement is only that there must be a way for keyboard interface users to perform the same, or comparable, actions and to operate the content.'
where identifier = '2.1.3' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to reduce accidental activation of keyboard shortcuts. Character key shortcuts work well for many keyboard users. However, they can be inappropriate and frustrating for speech input users, whose dictation is interpreted as strings of letters, and for keyboard users who are prone to accidentally hit keys. To rectify this issue, authors need to allow users to turn off or reconfigure shortcuts that are made up of only character keys.

Even though this success criterion refers to character keys, it''s not relevant whether a shortcut can be activated using a single physical key on a keyboard, or if it requires a combination of keys to be pressed. What matters is that a shortcut relies on a printable character (letters, punctuation, numbers, symbol characters), and not the number of physical keyboard keys that users need to press to trigger it.

Speech input users generally work in a single mode where they can use a mix of dictation and speech commands. Single-key shortcuts are disastrous for speech users. The reason for this is that when only a single key is used to trip a command, a spoken word can become a barrage of single-key commands if the cursor focus happens to be in the wrong place. […]'
where identifier = '2.1.4' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

-- ============================================================================
-- 2.2 Délai suffisant
-- ============================================================================

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure that users with disabilities are given adequate time to interact with web content whenever possible. People with disabilities such as blindness, low vision, dexterity impairments, and cognitive limitations may require more time to read content or to perform functions such as filling out on-line forms. If web functions are time-dependent, it will be difficult for some users to perform the required action before a time limit occurs. This may render the service inaccessible to them. Designing functions that are not time-dependent will help people with disabilities succeed at completing these functions. Providing options to disable time limits, customize the length of time limits, or request more time before a time limit occurs helps those users who require more time than expected to successfully complete tasks.

Any process that happens without user initiation after a set time or on a periodic basis is a time limit. This includes partial or full updates of content (for example, page refresh), changes to content, or the expiration of a window of opportunity for a user to react to a request for input. It also includes content that is advancing or updating at a rate beyond the user''s ability to read and/or understand it. […]'
where identifier = '2.2.1' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to avoid distracting users during their interaction with a web page.

In the context of this Success Criterion, "starts automatically" broadly refers to animations/updates that are not the direct result of a user''s intentional activation, for example, selecting a link or button.

"Moving, blinking and scrolling" refers to content in which the visible content conveys a sense of motion. Common examples include motion pictures, synchronized media presentations, animations, real-time games, and scrolling stock tickers. "Auto-updating" refers to content that updates or disappears based on a preset time interval. Common time-based content includes automatically updated weather information, news, stock price updates, and auto-advancing presentations and messages.

Content that moves or auto-updates can be a barrier to anyone who has trouble reading stationary text quickly as well as anyone who has trouble tracking moving objects. It can also cause problems for screen readers. Moving content can also be a severe distraction for some people. Certain groups, particularly those with attention deficit disorders, find blinking content distracting, making it difficult for them to concentrate on other parts of the web page. […]'
where identifier = '2.2.2' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to minimize the occurrence of content that requires timed interaction. This enables people with blindness, low vision, cognitive limitations, or motor impairments to interact with content. This differs from the Level A success criterion in that the only exception is for real-time events.'
where identifier = '2.2.3' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to allow users to turn off updates from the author/server except in emergencies. Emergencies would include civil emergency alert messages or any other messages that warn of danger to health, safety, or property, including data loss, loss of connection, etcetera.

This allows access by people with cognitive limitations or attention disorders by enabling them to focus on the content. It also allows users who are blind or have low vision to keep their "viewing" focus on the content they are currently reading.'
where identifier = '2.2.4' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to allow all users to complete authenticated transactions that have inactivity time limits or other circumstances that would cause a user to be logged out while in the midst of completing the transaction.

For security reasons, many sites implement an authentication time limit after a certain period of inactivity. These time limits may cause problems for persons with disabilities because it may take longer for them to complete the activity.

Other sites will log a person out of a session if a person logs in on the website from another computer or if other activities arise that make the site suspicious of whether the person is still the same legitimate person who logged in originally. When users are logged out while still in the midst of a transaction - it is important that they be given the ability to re-authenticate and continue with the transaction without the loss of any data already entered.'
where identifier = '2.2.5' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure that when a timeout is used, users know what duration of inactivity will cause the page to time out and result in lost data. The use of timed events can present significant barriers for users with cognitive disabilities, as these users may require more time to read content or to perform functions, such as completing an online form.

During the completion of an online process, such as to reserve a hotel room or purchase a plane ticket, a user with a cognitive impairment may become overwhelmed with lengthy instructions and data input required to complete the process. The user may not be able to complete the process in one sitting and may need to take a break. Users should be able to leave a process without losing their current place within the process, and without losing information that has already been entered.

This success criterion works in tandem with Success Criterion 2.2.1 Timing Adjustable, but is specifically focused on notification of timeouts related to user inactivity.

The best way to conform to this success criterion is to keep the user data for at least 20 hours. This enables the user with disabilities and the aging community to start and finish a task, taking breaks as needed.'
where identifier = '2.2.6' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

-- ============================================================================
-- 2.3 Crises et réactions physiques
-- ============================================================================

update public.criteria set methodology = '[EN] The intent of this success criterion is to allow users to access the full content of a site without inducing seizures due to photosensitivity.

Individuals who have photosensitive seizure disorders can have a seizure triggered by content that flashes at certain frequencies for more than a few flashes. People are even more sensitive to red flashing than to other colors, so a special test is provided for saturated red flashing. These guidelines were originally based on guidelines for the broadcasting industry as adapted for desktop monitors, where content is viewed from a closer distance (using a larger angle of vision).

Flashing can be caused by the display, the computer rendering the image or by the content being rendered. The author has no control of the first two. They can be addressed by the design and speed of the display and computer. The intent of this criterion is to ensure that flicker that violates the flash thresholds is not caused by the content itself. For example, the content could contain a video clip or animated image of a series of strobe flashes, or close-ups of rapid-fire explosions.

Content should be analyzed at the largest scale at which a user may view the content, and at the standard zoom level of the user agent. […]'
where identifier = '2.3.1' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The purpose of this success criterion is to further reduce the chance of seizures. Seizures cannot be completely eliminated since some people are so sensitive. However, by eliminating all 3-per-second flashing over any area of the screen, the chances of a person having a seizure are further reduced than when just meeting the measures ordinarily used today in standards internationally, as we do at Level A.

Compared to Success Criterion 2.3.1 Three Flashes or Below Threshold – which allows flashing if it is dim enough or has a small enough area – this criterion does not allow any flashing that occurs at a frequency greater than 3 per second, regardless of brightness or size. As a result, even a single flashing pixel would violate this criterion. The intent is to guard against flashing larger than a single pixel, but since an unknown amount of magnification or high contrast setting may be applied, the prohibition is against any flashing.'
where identifier = '2.3.2' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to allow users to prevent animation from being displayed on web pages. Some users experience distraction or nausea from animated content. For example, if scrolling a page causes elements to move (other than the essential movement associated with scrolling) it can trigger vestibular disorders. Vestibular (inner ear) disorder reactions include dizziness, nausea and headaches. Another animation that is often non-essential is parallax scrolling. Parallax scrolling occurs when backgrounds move at a different rate to foregrounds. Animation that is essential to the functionality or information of a web page is allowed by this success criterion.

"Animation from interactions" applies when a user''s interaction initiates non-essential animation. In contrast, 2.2.2 Pause, Stop, Hide applies when the web page initiates animation "automatically" that is not in response to an intentional user activation. There may be situations where a particular animation may fail both success criteria.

The impact of animation on people with vestibular disorders can be quite severe. Triggered reactions include nausea, migraine headaches, and potentially needing bed rest to recover.'
where identifier = '2.3.3' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

-- ============================================================================
-- 2.4 Navigable
-- ============================================================================

update public.criteria set methodology = '[EN] The intent of this success criterion is to allow people who navigate sequentially through content more direct access to the primary content of the web page. Web pages and applications often have content that appears on other pages or screens. Examples of repeated blocks of content include but are not limited to navigation links, header content, and advertising frames. Small repeated sections such as individual words, phrases or single links are not considered blocks for the purposes of this provision.

Users who navigate sequentially through content will generally have to navigate through repeated content on each page. This is in contrast to a sighted user''s ability to ignore the repeated material either by focusing on the center of the screen (where main content usually appears) or a mouse user''s ability to select a link with a single mouse click rather than encountering every link or form control that comes before the item they want.

It is not the intent of this success criterion to require authors to provide methods that are redundant to functionality provided by the user agent. Most web browsers provide keyboard shortcuts to move the user focus to the top of the page, so if a set of navigation links is provided at the bottom of a web page providing a "skip" link may be unnecessary.'
where identifier = '2.4.1' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to help users find content and orient themselves within it by ensuring that each web page has a descriptive title. Titles identify the current location without requiring users to read or interpret page content. When titles appear in site maps or lists of search results, users can more quickly identify the content they need. User agents make the title of the page easily available to the user for identifying the page. For instance, a user agent may display the page title in the window title bar or as the name of the tab containing the page.

In cases where the page is a document or a web application, the name of the document or web application would be sufficient to describe the purpose of the page. Note that it is not required to use the name of the document or web application; other things may also describe the purpose or the topic of the page.

In cases such as Single Page Applications (SPAs), where various distinct pages/views are all nominally served from the same URI and the content of the page is changed dynamically, the title of the page should also be changed dynamically to reflect the content or topic of the current view.'
where identifier = '2.4.2' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure that when users navigate sequentially through content, they encounter information in an order that is consistent with the meaning of the content and can be operated from the keyboard. This reduces confusion by letting users form a consistent mental model of the content. There may be different orders that reflect logical relationships in the content. For example, moving through components in a table one row at a time or one column at a time both reflect the logical relationships in the content. Either order may satisfy this success criterion.

The way that sequential navigation order is determined in web content is defined by the technology of the content. For example, simple HTML defines sequential navigation via the notion of tabbing order. Dynamic HTML may modify the navigation sequence using scripting along with the addition of a tabindex attribute to allow focus to additional elements.

The focus order may not be identical to the programmatically determined reading order as long as the user can still understand and operate the web page. Since there may be several possible logical reading orders for the content, the focus order may match any of them. Focus order needs to allow the user to navigate focusable elements in a logical order, and that order needs to preserve any meaning or operation that the page is conveying. […]'
where identifier = '2.4.3' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to help users understand the purpose of each link so they can decide whether they want to follow the link. Whenever possible, provide link text that identifies the purpose of the link without needing additional context. Assistive technology has the ability to provide users with a list of links that are on the web page. Link text that is as meaningful as possible will aid users who want to choose from this list of links. Meaningful link text also helps those who wish to tab from link to link. Meaningful links help users choose which links to follow without requiring complicated strategies to understand the page.

The text of, or associated with, the link is intended to describe the purpose of the link. In cases where the link takes one to a document or a web application, the name of the document or web application would be sufficient to describe the purpose of the link.

In some situations, authors may want to provide part of the description of the link in logically related text that provides the context for the link. In this case the user should be able to identify the purpose of the link without moving focus from the link. […]'
where identifier = '2.4.4' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to make it possible for users to locate content in a manner that best meets their needs. Users may find one technique easier or more comprehensible to use than another.

Even small sites should provide users some means of orientation. For a three or four page site, with all pages linked from the home page, it may be sufficient simply to provide links from and to the home page where the links on the home page can also serve as a site map.'
where identifier = '2.4.5' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to help users understand what information is contained in web pages and how that information is organized. When headings are clear and descriptive, users can find the information they seek more easily, and they can understand the relationships between different parts of the content more easily. Descriptive labels help users identify specific components within the content.

Labels and headings do not need to be lengthy. A word, or even a single character, may suffice if it provides an appropriate cue to finding and navigating content.

Labels of form controls are usually text-based. In some cases, images can serve as descriptive labels without additional text. In these cases, authors should ensure that the image and its use as a label (in context) are widely understood.

This success criterion requires that if headings or labels are provided, they be descriptive. This success criterion does not require headings or labels; labels for inputs are covered separately by 3.3.2 Labels or Instructions. This success criterion also does not require that content acting as a heading or label be correctly marked up or identified — that aspect is covered separately by 1.3.1 Info and Relationships.'
where identifier = '2.4.6' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The purpose of this success criterion is to help a person know which element has the keyboard focus.

"Mode of operation" accounts for user agents which may not always show a focus indicator, or only show the focus indicator when the keyboard is used. User agents may optimize when the focus indicator is shown, such as only showing it when a keyboard is used. Authors are responsible for providing at least one mode of operation where the focus is visible. In most cases there is only one mode of operation so this success criterion applies. The focus indicator must not be time limited, when the keyboard focus is shown it must remain.

There may be situations where mouse/pointer users could also benefit from having a visible focus indicator, even though they did not set focus to an element using the keyboard. As a best practice, consider still providing an explicit focus indicator for these cases.

Note that a keyboard focus indicator can take different forms. New in WCAG 2.2: While Focus Visible does not specify what that form is, 2.4.13 Focus Appearance (Level AAA) provides guidance on creating a consistent, visible indicator.'
where identifier = '2.4.7' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to provide a way for the user to orient herself within a set of web pages, a website, or a web application and find related information.'
where identifier = '2.4.8' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to help users understand the purpose of each link in the content, so they can decide whether they want to follow it. Best practice is that links with the same destination would have the same descriptions, but links with different purposes and destinations would have different descriptions (see also Success Criterion 3.2.4 Consistent Identification which calls for consistency in identifying components that have the same functionality). Because the purpose of a link can be identified from its link text, links can be understood when they are out of context, such as when the user agent provides a list of all the links on a page.

The text in the link is intended to describe the purpose of the link. In cases where the link takes one to a document or a web application, the name of the document or web application would be sufficient to describe the purpose of the link.

The success criterion includes an exception for links for which the purpose of the link cannot be determined from the information on the web page. The word "mechanism" is used to allow authors to either make all links fully understandable out of context by default or to provide a way to make them this way.'
where identifier = '2.4.9' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to provide headings for sections of a web page, when the page is organized into sections. For instance, long documents are often divided into a variety of chapters, chapters have subtopics, etc. When such sections exist, they need to have headings that introduce them. This clearly indicates the organization of the content, facilitates navigation within the content, and provides mental "handles" that aid in comprehension of the content. Other page elements may complement headings to improve presentation (e.g., horizontal rules and boxes), but visual presentation is not sufficient to identify document sections.

This provision is included at Level AAA because it cannot be applied to all types of content and it may not always be possible to insert headings. For example, when posting a pre-existing document to the web, headings that an author did not include in the original document cannot be inserted. Or, a long letter would often cover different topics, but putting headings into a letter would be very strange. However, if a document can be broken up into sections with headings, it facilitates both understanding and navigation.'
where identifier = '2.4.10' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure that the item receiving keyboard focus is always partially visible in the user''s viewport. For sighted people who rely on a keyboard (or on a device that operates through the keyboard interface, such as a switch or voice input), knowing the current point of focus is critical. The component with focus signals the interaction point on the page. Where users cannot see the item with focus, they may not know how to proceed, or may even think the system has become unresponsive.

In recognition of the complex responsive designs common today, this AA criterion allows for the component receiving focus to be partially obscured by other author-created content. A partly obscured component can still be very visible, although the more of it that is obscured, the less easy it is to see. For that reason, authors should attempt to design interactions to reduce the degree and frequency with which the item receiving focus is partly obscured. For best visibility, none of the component receiving focus should be obscured.

Typical types of content that can overlap focused items are sticky footers, sticky headers, and non-modal dialogs. As a user tabs through the page, these layers of content can obscure the item receiving focus, along with its focus indicator. […]'
where identifier = '2.4.11' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure that the item receiving keyboard focus is always visible in the user''s viewport. For sighted people who rely on a keyboard (or on a device that operates through the keyboard interface, such as a switch or voice input), knowing the current point of focus is critical. The component with focus signals the interaction point on the page. Where users cannot see the item with focus, they may not know how to proceed, or may even think the system has become unresponsive.

Typical types of content that can overlap focused items are sticky footers, sticky headers, and non-modal dialogs. As a user tabs through the page, these layers of content can hide the item receiving focus, along with its focus indicator.

A notification implemented as sticky content, such as a cookie banner, will fail this success criterion if it partially covers a component receiving focus. Ways of passing include making the banner modal so the user has to dismiss the banner before navigating through the page, or using scroll padding so the banner does not overlap other content. Notifications that do not require user action could also meet this criterion by closing on loss of focus.'
where identifier = '2.4.12' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The purpose of this success criterion is to ensure a keyboard focus indicator is clearly visible and discernible. Focus Appearance is closely related to 2.4.7 Focus Visible and 1.4.11 Non-text Contrast. Focus Visible requires that a visible focus indicator exists while a component has keyboard focus; Focus Appearance defines a minimum level of visibility. Where Non-text Contrast requires a component to have adequate contrast against the background in each of its states, Focus Appearance requires sufficient contrast for the focus indicator itself.

For sighted people with mobility impairments who use a keyboard or a device that utilizes the keyboard interface (such as a switch or voice input), knowing the current point of focus is very important. Visible focus must also meet the needs of users with low vision, who may also rely on the keyboard.

A keyboard focus indicator can take different forms. This Success Criterion encourages the use of a solid outline around the focused user interface component, but allows other types of indicators that are at least as large.'
where identifier = '2.4.13' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

-- ============================================================================
-- 2.5 Modalités d'entrée
-- ============================================================================

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure that content can be controlled with a range of pointing devices, abilities, and assistive technologies. Some people cannot perform gestures in a precise manner, or they may use a specialized or adapted input device such as a head pointer, eye-gaze system, or speech-controlled mouse emulator. Some pointing methods lack the capability or accuracy to perform multipoint or path-based gestures.

A path-based gesture involves an interaction where not just the endpoints matter, but how the pointer moves between these points. Swiping is an example of a path-based gesture, which is only recognized when the user moves in a (mostly) straight line from the start point to the end point.

Examples of path-based gestures include swiping, sliders and carousels dependent on the direction of interaction, and other gestures which trace a prescribed path such as drawing a specific shape. Examples of multipoint gestures include a two-finger pinch zoom, a split tap where one finger rests on the screen and a second finger taps, or a two- or three-finger tap or swipe.

Authors must ensure that their content can be operated without multipoint or path-based gestures. Multipoint or path-based gestures can be used so long as the functionality can also be operated by another method, such as a tap, click, double tap, double click, long press, or click & hold. […]'
where identifier = '2.5.1' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to make it easier for users to prevent accidental or erroneous pointer input. People with various disabilities can inadvertently initiate touch or mouse events with unwanted results.

The most accessible way to incorporate pointer cancellation is to make activation occur on the up-event. Up-event activation refers to the activation of a target when the pointer is released. In a touchscreen interaction, when the finger touches a target, the up-event activation only occurs when the finger is lifted while still being within the target boundary. Similarly in mouse interaction, the up-event occurs when the mouse button is released while the cursor is still within the boundary of the initial target.

Authors can reduce the problem of users inadvertently triggering an action by using generic platform activation/click events that activate functionality on the up-event. For example, the click event in JavaScript triggers on release of the primary mouse button.

Where the interaction is equivalent to a simple "click", up-event activation has a built-in ability to cancel. When activation occurs only as the pointer is released, users have the opportunity to Abort (cancel) the activation. Users who have difficulty accurately using a mouse or touchscreen benefit greatly from this basic behavior. […]'
where identifier = '2.5.2' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure that the words which visually label a component are also the words associated with the component programmatically. This helps ensure that people with disabilities can rely on visible labels as a means to interact with the components.

Most controls are accompanied by a visible text label. Those same controls have a programmatic name, also known as the accessible name. Users typically have a much better experience if the words and characters in the visible label of a control match or are contained within the accessible name. When these match, speech-input users (i.e., users of speech recognition applications) can navigate by speaking the visible text labels of components, such as menus, links, and buttons, that appear on the screen. Sighted users who use text-to-speech (e.g., screen readers) will also have a better experience if the text they hear matches the text they see on the screen.

Where text labels exist and are properly linked to the user interface components through established authoring practices, the label and name will normally match. When they don''t match, speech-input users who attempt to use the visible text label as a means of navigation or selection will be unsuccessful. The speech-based navigation fails because the visible label spoken by the users does not match (or is not part of) the accessible name that is enabled as a speech-input command.'
where identifier = '2.5.3' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure that functions triggered by moving a device (for example, shaking or tilting) or by gesturing towards the device (so that sensors like a camera can pick up and interpret the gesturing), can also be operated by more conventional user interface components.

Devices often have sensors that can act as inputs, such as accelerometer and gyroscope sensors on a phone or tablet device. These sensors can allow the user to control something by simply changing the orientation or moving the device in particular ways. In other situations, web content can interpret user gestures via the camera or other sensors to actuate functions. For example, shaking the device might issue an "Undo" command, or a gentle hand wave might be used to move forward or backward in a sequence of pages. Some users with disabilities are not able to operate these device sensors (either not at all, or not precisely enough) because the device is on a fixed mount (perhaps a wheelchair) or due to motor impairments. Therefore, functionality offered through motion must also be available by another mechanism.

In addition, some users may accidentally activate sensors due to tremors or other motor impairments. The user must have the ability to turn off motion actuation to prevent such accidental triggering of functions.'
where identifier = '2.5.4' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to help users who may have trouble activating a small target because of hand tremors, limited dexterity, or other reasons. If the target is too small, it may be difficult to aim at the target. Mice and similar pointing devices can be hard to use for these users, and a larger target will help them greatly in having positive outcomes on the web page.

Touch is particularly problematic as it is an input mechanism with coarse precision. Users lack the same level of fine control as on inputs such as a mouse or stylus. A finger is larger than a mouse pointer, and generally obstructs the user''s view of the precise location on the screen that is being touched/activated.

While this criterion defines a minimum target size, it is recommended that larger sizes are used to reduce the possibility of unintentional actions. This is particularly relevant if any of the following are true: the control is used frequently; the result of the interaction cannot be easily undone; the control is positioned where it will be difficult to reach, or is near the edge of the screen; the control is part of a sequential task. […]'
where identifier = '2.5.5' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure that people can use and switch between different modes of input when interacting with web content. Users may employ a variety of input mechanisms when interacting with web content. These may be a combination of mechanisms such as a keyboard or keyboard-like interfaces and pointer devices like a mouse, stylus or touchscreen.

Even though a device may have a primary input mechanism, the user may choose to employ alternative input mechanisms when interacting with the device. For example, the primary mechanism for mobile phones and tablets is the touchscreen. The user of these devices may choose to use a paired mouse or external keyboard as an alternative to using the touchscreen.

Users should be able to switch input mechanisms at any point should the user determine that certain tasks and interactions are more easily accomplished by using an alternative input mechanism. Content must not limit the user''s interaction to any particular input mechanism unless the restriction is essential, or is required to ensure the security of the content or to respect user settings.'
where identifier = '2.5.6' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure functionality that uses a dragging movement has another single pointer mode of operation without the need for the dexterity required to drag elements.

Some people cannot perform dragging movements in a precise manner. Others use a specialized or adapted input device, such as a trackball, head pointer, eye-gaze system, or speech-controlled mouse emulator, which may make dragging cumbersome and error-prone.

When an interface implements functionality that uses dragging movements, users perform four discrete actions: tap or click to establish a starting point, then press and hold that contact while performing a repositioning of the pointer, before releasing the pointer at the end point.

Not all users can accurately press and hold that contact while also repositioning the pointer. An alternative method must be provided so that users with mobility impairments who use a pointer (mouse, pen, or touch contact) can use the functionality.

This requirement is separate from keyboard accessibility because people using a touch screen device may not use a physical keyboard.'
where identifier = '2.5.7' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to help ensure targets can be easily activated without accidentally activating an adjacent target. Users with dexterity limitations and those who have difficulty with fine motor movement find it difficult to accurately activate small targets when there are other targets that are too close. Providing sufficient size, or sufficient spacing between targets, will reduce the likelihood of accidentally activating the wrong control.

Disabilities addressed by this requirement include hand tremors, spasticity, and quadriplegia. Some people with disabilities use specialized input devices instead of a computer mouse or trackpad. Typically these types of input device do not provide as much accuracy as mainstream pointing devices. Meeting this requirement also ensures that touchscreen interfaces are easier to use.

This success criterion defines a minimum size and, if this can''t be met, a minimum spacing. It is still possible to have very small, and difficult to activate, targets and meet the requirements of this Success Criterion, provided that the targets don''t have any adjacent targets that are too close. However, using larger target sizes will help many people use targets more easily.'
where identifier = '2.5.8' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

-- ============================================================================
-- 3.1 Lisible
-- ============================================================================

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure that content developers provide information in the web page that user agents need to present text and other linguistic content correctly. Both assistive technologies and conventional user agents can render text more accurately when the language of the web page is identified. Screen readers can load the correct pronunciation rules. Visual browsers can display characters and scripts correctly. Media players can show captions correctly. As a result, users with disabilities will be better able to understand the content.

The default human language of the web page is the default text-processing language as discussed in Internationalization Best Practices: Specifying Language in XHTML & HTML Content. When a web page uses several languages, the default text-processing language is the language which is used most. (If several languages are used equally, the first language used should be chosen as the default human language.)

For multilingual sites targeting Conformance Level A, the Working Group strongly encourages developers to follow Success Criterion 3.1.2 Language of Parts as well even though that is a Level AA success criterion.'
where identifier = '3.1.1' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure that user agents can correctly present phrases, passages, and in some cases words written in multiple languages. This makes it possible for user agents and assistive technologies to present content according to the presentation and pronunciation rules for that language. This applies to graphical browsers as well as screen readers, braille displays, and other voice browsers.

Both assistive technologies and conventional user agents can render text more accurately if the language of each passage of text is identified. Screen readers can use the pronunciation rules of the language of the text. Visual browsers can display characters and scripts in appropriate ways. This is especially important when switching between languages that read from left to right and languages that read from right to left, or when text is rendered in a language that uses a different alphabet.

Individual words or phrases in one language can become part of another language. For example, "rendezvous" is a French word that has been adopted in English, appears in English dictionaries, and is properly pronounced by English screen readers. Most professions require frequent use of technical terms which may originate from a foreign language. Such terms are usually not translated to all languages.'
where identifier = '3.1.2' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] Certain disabilities make it difficult to understand non-literal word usage and specialized words or usage. Certain disabilities make it difficult to understand figurative language or specialized usage. Providing such mechanisms is vital for these audiences. Specialized information intended for non-specialist readers is encouraged to satisfy this Success Criterion, even when claiming only Single-A or Double-A conformance.'
where identifier = '3.1.3' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure that users can access the expanded form of abbreviations.'
where identifier = '3.1.4' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] Content should be written as clearly and simply as possible. The intent of this Success Criterion is: to ensure that additional content is available to aid the understanding of difficult or complex text; to establish a testable measure indicating when such additional content is required.

This success criterion helps people with reading disabilities while also allowing authors to publish difficult or complex web content. Text difficulty is described in terms of the level of education required to read the text. Education levels are defined according to the International Standard Classification of Education, which was created to allow international comparison among systems of education.

Difficult or complex text may be appropriate for most members of the intended audience (that is, most of the people for whom the content has been created). But there are people with disabilities, including reading disabilities, even among highly educated users with specialized knowledge of the subject matter. It may be possible to accommodate these users by making the text more readable. If the text cannot be made more readable, then supplemental content is needed. Supplemental content is required when text demands reading ability more advanced than the lower secondary education level—that is, more than nine years of school. […]'
where identifier = '3.1.5' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to help people who are blind, people who have low vision, and people with reading disabilities to understand content in cases where meaning depends on pronunciation. Often words or characters have different meanings, each with its own pronunciation. The meaning of such words or characters can usually be determined from the context of the sentence. However, for more complex or ambiguous sentences, or for some languages, the meaning of the word cannot be easily determined or determined at all without knowing the pronunciation. When the sentence is read aloud and the screen reader reads the word using the wrong pronunciation, it can be even more difficult to understand than when read visually. When words are ambiguous or indeterminate unless the pronunciation is known, then providing some means of determining the pronunciation is needed.

For example, in the English language heteronyms are words that are spelled the same but have different pronunciations and meanings, such as the words desert (abandon) and desert (arid region). If the proper pronunciation can be determined from the context of the sentence, then nothing is required. If it cannot then some mechanism for determining the proper pronunciation would be required. Additionally, in some languages certain characters can be pronounced in different ways. In Japanese, for example, there are characters like Han characters (kanji) that have multiple pronunciations.'
where identifier = '3.1.6' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

-- ============================================================================
-- 3.2 Prévisible
-- ============================================================================

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure that functionality is predictable as visitors navigate their way through a document. Any component that is able to trigger an event when it receives focus must not change the context. Examples of changing context when a component receives focus include, but are not limited to: forms submitted automatically when a component receives focus; new windows launched when a component receives focus; focus is changed to another component when that component receives focus.

Focus may be moved to a control either via the keyboard (e.g. tabbing to a control) or the mouse (e.g. clicking on a text field). Moving the mouse over a control does not move the focus unless scripting implements this behavior. Note that for some types of controls, clicking on a control may also activate the control (e.g. button), which may, in turn, initiate a change in context.

What is meant by "component" here is also sometimes called "user interface element" or "user interface component".'
where identifier = '3.2.1' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure that entering data or selecting a form control has predictable effects. Changing the setting of any user interface component is changing some aspect in the control that will persist when the user is no longer interacting with it. So checking a checkbox, entering text into a text field, or changing the selected option in a list control changes its setting, but activating a link or a button does not. Changes in context can confuse users who do not easily perceive the change or are easily distracted by changes. Changes of context are appropriate only when it is clear that such a change will happen in response to the user''s action.

This success criterion covers changes in context due to changing the setting of a control. Clicking on links or buttons is activating a control, not changing the setting of that control.

What is meant by "component" and "user interface component" here is also sometimes called "user interface element".'
where identifier = '3.2.2' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to encourage the use of consistent presentation and layout for users who interact with repeated content within a set of web pages and need to locate specific information or functionality more than once. Individuals with low vision who use screen magnification to display a small portion of the screen at a time often use visual cues and page boundaries to quickly locate repeated content. Presenting repeated content in the same order is also important for visual users who use spatial memory or visual cues within the design to locate repeated content.

It is important to note that the use of the phrase "same order" in this section is not meant to imply that sub-navigation menus cannot be used or that blocks of secondary navigation or page structure cannot be used. Instead, this success criterion is intended to assist users who interact with repeated content across web pages to be able to predict the location of the content they are looking for and find it more quickly when they encounter it again.

Users may initiate a change in the order by using adaptive user agents or by setting preferences so that the information is presented in a way that is most useful to them.'
where identifier = '3.2.3' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure consistent identification of functional components that appear repeatedly within a set of web pages. A strategy that people who use screen readers use when operating a website is to rely heavily on their familiarity with functions that may appear on different web pages. If identical functions have different labels (or, more generally, a different accessible name) on different web pages, the site will be considerably more difficult to use. It may also be confusing and increase the cognitive load for people with cognitive limitations. Therefore, consistent labeling will help.

This consistency extends to the text alternatives. If icons or other non-text items have the same functionality, then their text alternatives should be consistent as well.

If there are two components on a web page that both have the same functionality as a component on another page in a set of web pages, then all 3 must be consistent. Hence the two on the same page will be consistent.

While it is desirable and best practice always to be consistent within a single web page, 3.2.4 Consistent Identification only addresses consistency within a set of web pages where something is repeated on more than one page in the set.'
where identifier = '3.2.4' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to encourage design of web content that gives users full control of changes of context. This success criterion aims to eliminate potential confusion that may be caused by unexpected changes of context, such as launching new windows, or automatic submission of forms after selecting an item from a list. Such unexpected changes of context may cause difficulties for people with motor impairments, people with low vision, people who are blind, and people with certain cognitive limitations.

Some types of change of context are not disruptive to some users, or actively benefit some users. For example, single-switch users rely on context changes that are animated by the system, and the preferences of low-vision users may vary depending on how much of the content they can see at once and how much of the session structure they can retain in working memory. Some types of content, such as slide shows, require the ability to change context in order to provide the intended user experience. Content that initiates changes of context automatically only when user preferences allow can conform to this success criterion.'
where identifier = '3.2.5' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure users can find help for completing tasks on a website, when it is available. When the placement of the help mechanism is kept consistent across a set of pages, users looking for help will find it easier to identify. This is distinct from interface-level help, such as contextual help, features like spell checkers, and instructional text in a form.

Locating the help mechanism in a consistent location across pages makes it easier for users to find it. For example, when a mechanism or link is located in the header of one web page, it will be easier to find if it is in the header of other pages. The help mechanism, such as a contact phone number, may be provided directly on the page, or it may also be a direct link to a contact page. Regardless of which approach is used, the mechanism must be located in the same relative order on each page within the set of pages.

When having problems completing a task on a website, people with some types of disabilities may not be able to work through the issue without further help. Without help, some users may abandon the task. They may also fail to correctly complete a task, or they may require assistance from people who do not necessarily keep private information secure.'
where identifier = '3.2.6' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

-- ============================================================================
-- 3.3 Assistance à la saisie
-- ============================================================================

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure that users are aware that an error has occurred and can determine what is wrong. In the case of an unsuccessful form submission, it is not sufficient to only re-display the form without providing any hint that the submission failed. The error must be indicated in text.

This SC requires that users be provided with information about the nature of the error, including the identity of the item in error. What the user should do to correct the item in error is covered by 3.3.3 Error Suggestion. Often, the error description can be phrased so that it meets both Success Criteria 3.3.1 Error Identification and 3.3.3 Error Suggestion at the same time. For instance, "Email is not valid" would pass 3.3.1, but "Please provide a valid email address in the format name@domain.com" also conveys how it can be fixed and passes both.

An "input error" includes: information that is required by the web page but omitted by the user, or information that is provided by the user but that falls outside the required data format or allowed values.

It is perfectly acceptable to indicate the error in other ways such as through the use of an image, color, or other visual indicator, in addition to the text description.'
where identifier = '3.3.1' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to have content authors present instructions or labels that identify the controls in a form so that users know what input data is expected. In the case of radio buttons, checkboxes, comboboxes, or similar controls that provide users with options, each option must have an appropriate label so that users know what they are actually selecting. Instructions or labels may also specify data formats for data entry fields, especially if they are out of the customary formats or if there are specific rules for correct input. Content authors may also choose to make such instructions available to users only when the individual control has focus especially when instructions are long and verbose.

The intent of this success criterion is not to clutter the page with unnecessary information but to provide important cues and instructions that will benefit people with disabilities. Too much information or instruction can be just as harmful as too little. The goal is to make certain that enough information is provided for the user to accomplish the task without undue confusion or navigation.

Note that the majority of form control labels are text-based. Using images as labels meets the requirements of the criterion, but care should be taken to ensure that the images are widely understood by the intended target audience.'
where identifier = '3.3.2' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure that users receive appropriate suggestions for correction of an input error if it is possible. The definition of "input error" says that it is "information provided by the user that is not accepted" by the system. Some examples of information that is not accepted include information that is required but omitted by the user and information that is provided by the user but that falls outside the required data format or allowed values.

Success Criterion 3.3.1 Error Identification provides for notification of errors. However, persons with cognitive limitations may find it difficult to understand how to correct the errors. People with visual disabilities may not be able to figure out exactly how to correct the error. In the case of an unsuccessful form submission, users may abandon the form because they may be unsure of how to correct the error even though they are aware that it has occurred.

The content author may provide the description of the error, or the user agent may provide the description of the error based on technology-specific, programmatically determined information.'
where identifier = '3.3.3' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to help users with disabilities avoid serious consequences as the result of a mistake when performing an action that cannot be reversed. For example, purchasing non-refundable airline tickets or submitting an order to purchase stock in a brokerage account are financial transactions with serious consequences. If users have made a mistake on the date of air travel, they could end up with a ticket for the wrong day that cannot be exchanged. If users made a mistake on the number of stock shares to be purchased, they could end up purchasing more stock than intended. Both of these types of mistakes involve transactions that take place immediately and cannot be altered afterwards, and can be very costly. Likewise, it may be an unrecoverable error if users unintentionally modify or delete data stored in a database that they later need to access.

Users with disabilities may be more likely to make mistakes. People with reading disabilities may transpose numbers and letters, and those with motor disabilities may hit keys by mistake. Providing the ability to reverse actions allows users to correct a mistake that could result in serious consequences. Providing the ability to review and correct information gives the user an opportunity to detect a mistake before taking an action that has serious consequences.'
where identifier = '3.3.4' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to help users avoid making mistakes. Some users with disabilities may be more likely to make mistakes than users without disabilities. Using context-sensitive help, users find out how to perform an operation without losing track of what they are doing.

Context-sensitive help only needs to be provided when the label is not sufficient to describe all functionality. The existence of context-sensitive help should be obvious to the user and they should be able to obtain it whenever they require it.

The content author may provide the help text, or the user agent may provide the help text based on technology-specific, programmatically determined information.'
where identifier = '3.3.5' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to help users with disabilities avoid consequences that may result from making a mistake when submitting form data. This criterion builds on Success Criterion 3.3.4 Error Prevention (Legal, Financial, Data) in that it applies to all forms that require users to submit information.

Users with disabilities may be more likely to make mistakes and may have more difficulty detecting or recovering from mistakes. People with reading disabilities may transpose numbers and letters, and those with motor disabilities may hit keys by mistake. Providing the ability to reverse actions allows users to correct a mistake. Providing the ability to review and correct information gives the user an opportunity to detect a mistake before taking an action.'
where identifier = '3.3.6' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure that users can successfully complete multi-step processes. It reduces cognitive effort where information is asked for more than once during a process. It also reduces the need to recall information provided in a previous step.

Information that is required to be remembered for input can pose a significant barrier to users with cognitive or memory difficulties. All users experience a natural gradual mental fatigue as they proceed through steps in a process. This fatigue is accelerated by the stress of recalling information from short-term working memory. Users with learning, and cognitive disabilities are highly susceptible to mental fatigue.

Requiring people to recall information previously entered can cause them to give up or re-enter the same information incorrectly. The autocomplete feature of browsers is not considered sufficient because it is the content (the website) that needs to provide the stored information for a redundant entry, or avoid asking for the same information again.

This success criterion does not add a requirement to store information between sessions. A process is defined on the basis of an activity and is not applicable when a user returns after closing a session or navigating away.'
where identifier = '3.3.7' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The purpose of this success criterion is to ensure there is an accessible, easy-to-use, and secure method for users to authenticate when logging into an existing account. As the most prevalent form of authentication, websites commonly rely on usernames and passwords to log in. However, memorizing a username and password places a very high or impossible burden upon people with certain cognitive disabilities, as do additional steps often added to authentication processes. For instance, the need to transcribe a one-time verification code or requiring a puzzle to be solved.

Remembering a site-specific password is a cognitive function test. Such tests are known to be problematic for many people with cognitive disabilities. Whether it is remembering random strings of characters, or a pattern gesture to perform on a touch screen, cognitive function tests will exclude some people. When a cognitive function test is used, at least one other authentication method must be available which is not a cognitive function test.

Websites can employ username (or email) and password inputs as an authentication method if the author enables the user agent (browsers and third-party password managers) to fill in the fields automatically. Copy and paste can be relied on to avoid transcription. […]'
where identifier = '3.3.8' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The purpose of this success criterion is to ensure there is an accessible, easy-to-use, and secure method to log in, access content, and undertake tasks. This criterion is the same as Accessible Authentication (Minimum) but without the exceptions for objects and user-provided content.

Any required step of the authentication process: cannot display a selection of images, videos, or audio clips, where users must choose which image they provided; cannot display a selection of images, where users must choose the images which contain a specific object, such as a car.'
where identifier = '3.3.9' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

-- ============================================================================
-- 4.1 Compatible
-- ============================================================================

update public.criteria set methodology = '[EN] The intent of this success criterion is to ensure that Assistive Technologies (AT) can gather appropriate information about, activate (or set) and keep up to date on the status of user interface controls in the content.

When standard controls from accessible technologies are used, this process is straightforward. If the user interface elements are used according to specification the conditions of this provision will be met.

If custom controls are created, however, or interface elements are programmed (in code or script) to have a different role and/or function than usual, then additional measures need to be taken to ensure that the controls provide important and appropriate information to assistive technologies and allow themselves to be controlled by assistive technologies.

What roles and states are appropriate to convey to assistive technology will depend on what the control represents. Specifics about such information are defined by other specifications, such as WAI-ARIA, or the relevant platform standards. Another factor to consider is whether there is sufficient accessibility support with assistive technologies to convey the information as specified.

A particularly important state of a user interface control is whether or not it has focus. The focus state of a control can be programmatically determined, and notifications about change of focus are sent to user agents and assistive technology.'
where identifier = '4.1.2' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

update public.criteria set methodology = '[EN] The intent of this success criterion is to make users aware of important changes in content that are not given focus, and to do so in a way that doesn''t unnecessarily interrupt their work.

The intended beneficiaries are blind and low vision users of assistive technologies with screen reader capabilities. An additional benefit is that assistive technologies for users with cognitive disabilities may achieve an alternative means of indicating (or even delaying or suppressing) status messages, as preferred by the user.

The scope of this success criterion is specific to changes in content that involve status messages. A status message is a defined term in WCAG. There are two main criteria that determine whether something meets the definition of a status message: the message provides information to the user on the success or results of an action, on the waiting state of an application, on the progress of a process, or on the existence of errors; the message is not delivered via a change in context.

Information can be added to pages which does not meet the definition of a status message. For example, the list of results obtained from a search are not considered a status update and thus are not covered by this success criterion. However, brief text messages displayed about the completion or status of the search, such as "Searching...", "18 results returned" or "No results returned" would be status updates if they do not take focus.'
where identifier = '4.1.3' and thematic_id in (select id from public.thematics where reference_id = '33333333-3333-3333-3333-333333333333');

-- ============================================================================
-- Vérification finale
-- ============================================================================

do $$
declare
  filled_count int;
  total_count  int;
begin
  select count(*) into total_count
  from public.criteria
  where thematic_id in (
    select id from public.thematics
    where reference_id = '33333333-3333-3333-3333-333333333333'
  );

  select count(*) into filled_count
  from public.criteria
  where methodology is not null
    and thematic_id in (
      select id from public.thematics
      where reference_id = '33333333-3333-3333-3333-333333333333'
    );

  raise notice 'WCAG 2.2 · methodology remplie pour % critères sur %', filled_count, total_count;

  if filled_count < 80 then
    raise exception 'WCAG 2.2 · methodology insuffisamment remplie : % / 86 (attendu >= 80)', filled_count;
  end if;
end$$;

commit;
