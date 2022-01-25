import NoSpecsPage from './NoSpecsPage.vue'
import { defaultMessages } from '@cy/i18n'
import { NoSpecsPageFragmentDoc } from '../generated/graphql-test'

const pageTitleSelector = '[data-cy=create-spec-page-title]'
const pageDescriptionSelector = '[data-cy=create-spec-page-description]'
const noSpecsMessageSelector = '[data-cy=no-specs-message]'
const viewSpecsSelector = '[data-cy=view-spec-pattern]'

const messages = defaultMessages.createSpec

describe('<NoSpecsPage />', { viewportHeight: 655, viewportWidth: 1032 }, () => {
  describe('mounting in component mode with default specPattern set', () => {
    beforeEach(() => {
      cy.mountFragment(NoSpecsPageFragmentDoc, {
        onResult: (ctx) => {
          ctx.currentProject = {
            ...ctx.currentProject,
            config: {},
            id: 'id',
            storybook: null,
            configFileAbsolutePath: '/usr/bin/cypress.config.ts',
            currentTestingType: 'component',
            specsBare: { ...ctx.currentProject?.specsBare, edges: ctx.currentProject?.specsBare?.edges || [] },
          }
        },
        render: (gql) => {
          return <NoSpecsPage gql={gql} isDefaultSpecPattern={true} title={messages.page.defaultPatternNoSpecs.title} />
        },
      })
    })

    it('renders the "No Specs" footer', () => {
      cy.get(noSpecsMessageSelector)
      .should('be.visible')
      .and('contain.text', messages.noSpecsMessage)
      .get(viewSpecsSelector)
      .should('be.visible')
      .and('contain.text', messages.viewSpecPatternButton)
    })

    it('renders the correct text for component testing', () => {
      cy.get(pageTitleSelector).should('contain.text', messages.page.defaultPatternNoSpecs.title)
      .get(pageDescriptionSelector).should('contain.text', messages.page.defaultPatternNoSpecs.component.description)

      const text = defaultMessages.createSpec.component

      cy.contains(text.importFromComponent.header).should('be.visible')
      cy.contains(text.importFromComponent.description).should('be.visible')
      cy.contains(text.importFromStory.header).should('be.visible')
      cy.contains(text.importFromStory.notSetupDescription).should('be.visible')
      cy.percySnapshot()
    })
  })

  describe('mounting in e2e mode with default spec pattern set', () => {
    beforeEach(() => {
      cy.mountFragment(NoSpecsPageFragmentDoc, {
        onResult: (ctx) => {
          ctx.currentProject = {
            ...ctx.currentProject,
            config: {},
            configFileAbsolutePath: '/usr/bin/cypress.config.ts',
            id: 'id',
            storybook: null,
            currentTestingType: 'e2e',
            specsBare: { ...ctx.currentProject?.specsBare, edges: ctx.currentProject?.specsBare?.edges || [] },
          }
        },
        render: (gql) => {
          return <NoSpecsPage gql={gql} isDefaultSpecPattern={true} title={messages.page.defaultPatternNoSpecs.title} />
        },
      })
    })

    it('renders the correct text', () => {
      cy.get(pageTitleSelector)
      .should('contain.text', messages.page.defaultPatternNoSpecs.title)
      .get(pageDescriptionSelector).should('contain.text', messages.page.defaultPatternNoSpecs.e2e.description)

      const text = defaultMessages.createSpec.e2e

      cy.contains(text.importFromScaffold.header).should('be.visible')
      cy.contains(text.importFromScaffold.description).should('be.visible')
      cy.contains(text.importEmptySpec.header).should('be.visible')
      cy.contains(text.importEmptySpec.description).should('be.visible')
      cy.percySnapshot()
    })
  })

  describe('mounting with custom specPattern set', () => {
    it('renders the correct text for component testing', () => {
      const customSpecPattern = 'cypress/**/*.cy.ts'

      const showCreateSpecModal = cy.spy().as('showCreateSpecModal')

      cy.mountFragment(NoSpecsPageFragmentDoc, {
        onResult: (res) => {
          if (res.currentProject?.config) {
            res.currentProject.config = res.currentProject.config.map((x) => {
              if (x.field === 'e2e') {
                return { ...x, value: { ...x.value, specPattern: customSpecPattern } }
              }

              return x
            })
          }
        },
        render: (gql) => {
          return (
            <NoSpecsPage gql={gql} onShowCreateSpecModal={showCreateSpecModal} isDefaultSpecPattern={false} title={messages.page.customPatternNoSpecs.title} />
          )
        },
      })

      cy.get(pageTitleSelector).should('contain.text', messages.page.customPatternNoSpecs.title)
      .get(pageDescriptionSelector).should('contain.text', messages.page.customPatternNoSpecs.description.replace('{0}', ' specPattern '))

      // show spec pattern
      cy.contains(customSpecPattern)
      cy.contains(defaultMessages.createSpec.updateSpecPattern)

      cy.contains(defaultMessages.createSpec.newSpec).click()

      cy.get('@showCreateSpecModal').should('have.been.called')
    })
  })
})
