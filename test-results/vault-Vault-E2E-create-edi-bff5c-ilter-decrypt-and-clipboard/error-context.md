# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - link "register" [ref=e4] [cursor=pointer]:
      - /url: /sign-up
    - generic [ref=e5]:
      - generic [ref=e6]:
        - heading "Next/Passw*ird" [level=1] [ref=e7]:
          - text: Next/
          - link "Passw*ird" [ref=e8] [cursor=pointer]:
            - /url: /
        - paragraph [ref=e9]:
          - generic [ref=e10]: Login
          - text: to continue using this app
      - generic [ref=e12]:
        - generic [ref=e13]:
          - generic [ref=e14]: Email or Username
          - textbox "Email or Username" [disabled] [ref=e15]: e2e@example.com
        - generic [ref=e16]:
          - generic [ref=e17]: Password
          - generic [ref=e18]:
            - textbox "Enter your password" [disabled] [ref=e19]: Password!123
            - button [ref=e20] [cursor=pointer]:
              - img [ref=e21] [cursor=pointer]
        - button "Log In..." [disabled]
  - region "Notifications alt+T"
  - generic [ref=e24]:
    - img [ref=e26]
    - button "Open Tanstack query devtools" [ref=e74] [cursor=pointer]:
      - img [ref=e75] [cursor=pointer]
  - alert [ref=e123]
```