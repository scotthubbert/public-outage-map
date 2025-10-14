# Contributing to ISP Outage Map

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/public-outage-map.git
   cd public-outage-map
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm
- A Mapbox account (free tier is fine)
- Git

### Running Locally

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Code Style and Standards

### JavaScript

- Use ES6+ features (const/let, arrow functions, template literals)
- Follow existing code formatting (2 spaces for indentation)
- Keep functions small and focused
- Add comments for complex logic
- Avoid using frameworks - this is a vanilla JS project

### CSS

- Use CSS custom properties for theming
- Follow BEM-like naming conventions where appropriate
- Keep selectors specific but not overly complex
- Support both light and dark modes

### HTML

- Use semantic HTML5 elements
- Ensure accessibility (ARIA labels, alt text, etc.)
- Keep markup clean and well-indented

## What to Contribute

### Bug Fixes

Found a bug? Great! Please:

1. Check if an issue already exists
2. If not, create a new issue describing the bug
3. Reference the issue number in your PR

### New Features

Before adding a new feature:

1. Open an issue to discuss the feature
2. Get feedback from maintainers
3. Implement with tests if applicable
4. Update documentation

### Good First Issues

Look for issues tagged with `good first issue` - these are great starting points!

Some ideas:

- Improve error messages
- Add more utility functions
- Enhance mobile responsiveness
- Add more map style options
- Improve documentation

## Pull Request Process

1. **Update your branch** with the latest main:

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Test your changes**:

   - Run `npm run dev` and test manually
   - Build with `npm run build` and verify no errors
   - Test in both light and dark mode
   - Check responsive design on mobile

3. **Commit your changes**:

   ```bash
   git add .
   git commit -m "feat: add feature description"
   ```

   Use conventional commit messages:

   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting)
   - `refactor:` - Code refactoring
   - `perf:` - Performance improvements
   - `test:` - Adding or updating tests
   - `chore:` - Maintenance tasks

4. **Push to your fork**:

   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**:

   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill out the PR template
   - Link related issues

6. **Address feedback**:
   - Respond to review comments
   - Make requested changes
   - Push updates to your branch

## Project Structure

```
public-outage-map/
├── index.html          # Main entry point
├── config.js           # ISP configurations
├── app.js              # Main application logic
├── utils.js            # Utility functions
├── styles.css          # All styles
├── vite.config.js      # Build configuration
├── database/           # Database schemas
├── .github/            # GitHub Actions
└── docs/               # Documentation
```

## Areas for Contribution

### 1. Core Features

- Map interactions and controls
- Data fetching and caching
- Error handling
- Performance optimization

### 2. Configuration

- Additional ISP configuration options
- Map style presets
- Geocoder enhancements

### 3. UI/UX

- Visual improvements
- Animations and transitions
- Mobile experience
- Accessibility enhancements

### 4. Documentation

- Code comments
- README improvements
- Tutorial creation
- API documentation

### 5. Testing

- Manual testing procedures
- Edge case handling
- Browser compatibility

## Code Review Checklist

Before submitting, ensure:

- [ ] Code follows existing style
- [ ] Changes work in both light and dark mode
- [ ] Responsive design maintained
- [ ] No console errors
- [ ] Comments added where needed
- [ ] Documentation updated
- [ ] Commit messages are clear
- [ ] No unnecessary files included
- [ ] Works with demo data
- [ ] No hardcoded values (use config instead)

## Reporting Issues

When reporting bugs, include:

- Browser and version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Console errors
- Your configuration (without sensitive data)

## Feature Requests

For feature requests:

- Describe the problem you're trying to solve
- Explain your proposed solution
- Provide examples or mockups if possible
- Consider how it fits with existing features

## Questions?

- Check existing issues and discussions
- Read the documentation thoroughly
- Look at closed PRs for examples
- Ask in the issue tracker

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism
- Focus on what's best for the project
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discriminatory language
- Personal attacks
- Trolling or inflammatory comments
- Publishing others' private information
- Unprofessional conduct

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT).

## Recognition

Contributors will be:

- Listed in the project's contributors
- Mentioned in release notes
- Appreciated for their efforts!

---

Thank you for contributing to ISP Outage Map! 🎉
